const prisma = require('../config/database');
const EWayBillService = require('../services/ewayBillService');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique 12-digit numeric e-Way Bill number
 */
const generateBillNo = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
};

/**
 * Calculate validity days based on distance (1 day per 200km)
 */
const calculateValidity = (distanceKm) => {
    const days = Math.max(1, Math.ceil(distanceKm / 200));
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + days);
    return validUntil;
};

/**
 * POST /api/eway-bill/absorption
 * Handle Handover between two trucks
 */
const handleAbsorption = async (req, res) => {
    const { driverId, driverPhone, exchangedGoods, importerDriverId } = req.body;

    try {
        // 1. Resolve Data using Prisma Transaction to ensure safety
        const result = await prisma.$transaction(async (tx) => {
            // Find Exporter (Truck A) Driver
            const exporterDriver = await tx.user.findFirst({
                where: {
                    OR: [
                        { id: driverId || '' },
                        { phone: driverPhone || '' }
                    ]
                },
                include: {
                    courierCompany: true,
                    assignedDeliveries: {
                        where: { status: { not: 'COMPLETED' } },
                        include: {
                            shipment: {
                                include: {
                                    shipper: true,
                                    recipient: true
                                }
                            }
                        }
                    }
                }
            });

            if (!exporterDriver) throw new Error('Exporter driver not found');

            // Find Importer (Truck B) Driver
            const importerDriver = await tx.user.findUnique({
                where: { id: importerDriverId },
                include: {
                    courierCompany: true,
                    assignedDeliveries: {
                        where: { status: { not: 'COMPLETED' } },
                        include: {
                            shipment: {
                                include: {
                                    shipper: true,
                                    recipient: true
                                }
                            }
                        }
                    }
                }
            });

            if (!importerDriver) throw new Error('Importer driver not found');

            // Resolve Truck License Plates
            const truckA = await tx.truck.findFirst({ where: { ownerId: exporterDriver.id } });
            const truckB = await tx.truck.findFirst({ where: { ownerId: importerDriver.id } });

            if (!truckA || !truckB) throw new Error('Truck details not found for drivers');

            // Identify goods to transfer
            const goodsToTransfer = exchangedGoods; // Array of Delivery IDs
            const transferredDeliveries = exporterDriver.assignedDeliveries.filter(d => goodsToTransfer.includes(d.id));
            const remainingDeliveries = exporterDriver.assignedDeliveries.filter(d => !goodsToTransfer.includes(d.id));

            // Update database: Transfer deliveries to Truck B
            await tx.delivery.updateMany({
                where: { id: { in: goodsToTransfer } },
                data: {
                    driverId: importerDriver.id,
                    truckId: truckB.id,
                    status: 'ABSORPTION_TRANSFERRED'
                }
            });

            // Generate e-Way Bill Data for Truck A (Remaining Packages)
            const billANo = generateBillNo();
            const totalDistA = remainingDeliveries.reduce((sum, d) => sum + (d.distanceKm || 0), 0);
            const validUntilA = calculateValidity(totalDistA);

            const qrDataA = await EWayBillService.generateQRCode({ billNo: billANo, gstin: exporterDriver.courierCompany?.gstin || '27AAAAA0000A1Z5' });

            const billAData = {
                billNo: billANo,
                generatedDate: new Date().toLocaleString(),
                generatedBy: exporterDriver.name,
                validFrom: new Date().toLocaleString(),
                validUntil: validUntilA.toLocaleString(),
                qrCode: qrDataA,
                supplierGstin: exporterDriver.courierCompany?.gstin || '27AAAAA0000A1Z5',
                dispatchPlace: exporterDriver.homeBaseCity || 'Origin Hub',
                recipientGstin: remainingDeliveries[0]?.shipment?.recipient?.gstin || '27BBBBB0000B1Z5',
                deliveryPlace: remainingDeliveries[0]?.dropLocation || 'Final Destination',
                docNo: `DOC-${uuidv4().substring(0, 8)}`,
                docDate: new Date().toLocaleDateString(),
                transactionType: 'Regular',
                vehicleNo: truckA.licensePlate,
                fromLocation: exporterDriver.homeBaseCity || 'Current Location',
                goods: remainingDeliveries.map(d => ({
                    hsnCode: '8708',
                    productName: d.cargoType,
                    quantity: d.packageCount,
                    unit: 'NOS',
                    value: d.baseEarnings.toFixed(2)
                }))
            };

            // Generate e-Way Bill Data for Truck B (Original + Absorbed)
            const billBNo = generateBillNo();
            const combinedDeliveries = [...importerDriver.assignedDeliveries, ...transferredDeliveries];
            const totalDistB = combinedDeliveries.reduce((sum, d) => sum + (d.distanceKm || 0), 0);
            const validUntilB = calculateValidity(totalDistB);

            const qrDataB = await EWayBillService.generateQRCode({ billNo: billBNo, gstin: importerDriver.courierCompany?.gstin || '27CCCCC0000C1Z5' });

            const billBData = {
                billNo: billBNo,
                generatedDate: new Date().toLocaleString(),
                generatedBy: importerDriver.name,
                validFrom: new Date().toLocaleString(),
                validUntil: validUntilB.toLocaleString(),
                qrCode: qrDataB,
                supplierGstin: importerDriver.courierCompany?.gstin || '27CCCCC0000C1Z5',
                dispatchPlace: importerDriver.homeBaseCity || 'Transit Hub',
                recipientGstin: combinedDeliveries[0]?.shipment?.recipient?.gstin || '27DDDDD0000D1Z5',
                deliveryPlace: combinedDeliveries[0]?.dropLocation || 'Final Destination',
                docNo: `DOC-${uuidv4().substring(0, 8)}`,
                docDate: new Date().toLocaleDateString(),
                transactionType: 'Regular',
                vehicleNo: truckB.licensePlate,
                fromLocation: importerDriver.homeBaseCity || 'Current Location',
                goods: combinedDeliveries.map(d => ({
                    hsnCode: '8708',
                    productName: d.cargoType,
                    quantity: d.packageCount,
                    unit: 'NOS',
                    value: d.baseEarnings.toFixed(2)
                }))
            };

            return { billAData, billBData };
        });

        // 2. Generate PDFs outside transaction to avoid keeping DB connections open
        const pdfA = await EWayBillService.generatePDF(result.billAData);
        const pdfB = await EWayBillService.generatePDF(result.billBData);

        // 3. Create Zip
        const zipBuffer = await EWayBillService.createZip([
            { name: 'truckA_ewaybill.pdf', buffer: pdfA },
            { name: 'truckB_ewaybill.pdf', buffer: pdfB }
        ]);

        // 4. Send Response
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=ewaybills_absorption.zip');
        res.send(zipBuffer);

    } catch (error) {
        console.error('Absorption e-Way Bill Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    handleAbsorption
};
