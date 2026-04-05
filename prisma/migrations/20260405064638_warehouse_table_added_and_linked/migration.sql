/*
  Warnings:

  - A unique constraint covering the columns `[shipmentId]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[packageId]` on the table `Delivery` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cargoType` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cargoVolumeLtrs` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dispatcherId` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageId` to the `Delivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baselineDistance` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `carbonSaved` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emptyMilesSaved` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPackages` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalVolume` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalWeight` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `utilizationPercent` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxVolume` to the `Truck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxWeight` to the `Truck` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AbsorptionStatus" AS ENUM ('PENDING', 'ACCEPTED_BY_ROUTE1', 'ACCEPTED_BY_ROUTE2', 'BOTH_ACCEPTED', 'REJECTED', 'EXPIRED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'QR_SCANNED', 'CHECKLIST_VERIFIED', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BackhaulStatus" AS ENUM ('PROPOSED', 'ACCEPTED', 'EN_ROUTE_TO_PICKUP', 'PICKED_UP', 'DELIVERED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING', 'AWAITING_DISPATCHER', 'DISPATCHER_APPROVED', 'DISPATCHER_REJECTED', 'DRIVER_NOTIFIED', 'DRIVER_ACCEPTED', 'DRIVER_REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BASE_DELIVERY', 'MARKETPLACE_BONUS', 'ABSORPTION_BONUS', 'FUEL_SURCHARGE', 'TOLL_REIMBURSEMENT', 'PENALTY', 'BONUS', 'ADJUSTMENT', 'BACKHAUL_BONUS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('DELIVERY_ASSIGNED', 'ABSORPTION_AVAILABLE', 'ABSORPTION_ACCEPTED', 'ABSORPTION_COMPLETED', 'BACKHAUL_OPPORTUNITY', 'DELIVERY_UPDATE', 'ROUTE_UPDATE', 'SYSTEM_ALERT', 'GPS_VERIFIED', 'SHIPMENT_APPROVED', 'SHIPMENT_REJECTED', 'PAYMENT_PROCESSED', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED');

-- CreateEnum
CREATE TYPE "EwbStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRING_SOON', 'TRANSFERRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DeliveryStatus" ADD VALUE 'ABSORPTION_PROPOSED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'ABSORPTION_ACCEPTED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'ABSORPTION_TRANSFERRED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'AWAITING_CONFIRMATION';

-- DropForeignKey
ALTER TABLE "OptimizedRoute" DROP CONSTRAINT "OptimizedRoute_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_warehouseId_fkey";

-- DropIndex
DROP INDEX "OptimizedRoute_truckId_idx";

-- AlterTable
ALTER TABLE "Delivery" ADD COLUMN     "absorptionBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "baseEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "baselineDistance" DOUBLE PRECISION,
ADD COLUMN     "carbonEmitted" DOUBLE PRECISION,
ADD COLUMN     "cargoType" TEXT NOT NULL,
ADD COLUMN     "cargoVolumeLtrs" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dispatcherId" TEXT NOT NULL,
ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "distanceTraveled" DOUBLE PRECISION,
ADD COLUMN     "dropTime" TIMESTAMP(3),
ADD COLUMN     "estimatedETA" TIMESTAMP(3),
ADD COLUMN     "fuelSurcharge" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "isMarketplaceLoad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketplaceBonus" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "packageCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "packageId" TEXT NOT NULL,
ADD COLUMN     "pickupTime" TIMESTAMP(3),
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "shipmentId" TEXT,
ADD COLUMN     "timeWindowEnd" TIMESTAMP(3),
ADD COLUMN     "timeWindowStart" TIMESTAMP(3),
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "OptimizedRoute" ADD COLUMN     "baselineDistance" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "carbonSaved" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "emptyMilesSaved" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "isTSPOptimized" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "routePolyline" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "totalPackages" INTEGER NOT NULL,
ADD COLUMN     "totalVolume" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalWeight" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "utilizationPercent" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "waypoints" JSONB,
ALTER COLUMN "totalDistance" SET DEFAULT 0.0,
ALTER COLUMN "totalDuration" SET DEFAULT 0.0,
ALTER COLUMN "endLat" DROP NOT NULL,
ALTER COLUMN "endLng" DROP NOT NULL,
ALTER COLUMN "startLat" DROP NOT NULL,
ALTER COLUMN "startLng" DROP NOT NULL,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "co2PerKm" DOUBLE PRECISION,
ADD COLUMN     "currentVolume" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "currentWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "fuelConsumption" DOUBLE PRECISION,
ADD COLUMN     "fuelLevel" DOUBLE PRECISION,
ADD COLUMN     "fuelType" "FuelType",
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "maxVolume" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "maxWeight" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "mileage" DOUBLE PRECISION,
ADD COLUMN     "nextService" DOUBLE PRECISION,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "sourceHubId" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "warehouseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "avatarColor" TEXT,
ADD COLUMN     "currentVehicleNo" TEXT,
ADD COLUMN     "deliveriesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "homeBaseCity" TEXT,
ADD COLUMN     "initials" TEXT,
ADD COLUMN     "lastActiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "registeredAt" TIMESTAMP(3),
ADD COLUMN     "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "status" "DriverStatus" NOT NULL DEFAULT 'ON_DUTY',
ADD COLUMN     "totalDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "totalHoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "vehicleType" TEXT,
ADD COLUMN     "weekResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "weeklyEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "weeklyKmDriven" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gstin" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSLog" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualHub" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "type" TEXT,
    "radius" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VirtualHub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsorptionOpportunity" (
    "id" TEXT NOT NULL,
    "route1Id" TEXT NOT NULL,
    "route2Id" TEXT NOT NULL,
    "overlapDistanceKm" DOUBLE PRECISION NOT NULL,
    "overlapStartTime" TIMESTAMP(3) NOT NULL,
    "overlapEndTime" TIMESTAMP(3) NOT NULL,
    "nearestHubId" TEXT NOT NULL,
    "overlapPolyline" TEXT,
    "overlapCenterLat" DOUBLE PRECISION NOT NULL,
    "overlapCenterLng" DOUBLE PRECISION NOT NULL,
    "estimatedMeetTime" TIMESTAMP(3) NOT NULL,
    "timeWindow" INTEGER NOT NULL,
    "eligibleDeliveryIds" TEXT NOT NULL,
    "truck1DistanceBefore" DOUBLE PRECISION NOT NULL,
    "truck1DistanceAfter" DOUBLE PRECISION NOT NULL,
    "truck2DistanceBefore" DOUBLE PRECISION NOT NULL,
    "truck2DistanceAfter" DOUBLE PRECISION NOT NULL,
    "totalDistanceSaved" DOUBLE PRECISION NOT NULL,
    "potentialCarbonSaved" DOUBLE PRECISION NOT NULL,
    "spaceRequiredVolume" DOUBLE PRECISION NOT NULL,
    "spaceRequiredWeight" DOUBLE PRECISION NOT NULL,
    "truck1SpaceAvailable" DOUBLE PRECISION NOT NULL,
    "truck2SpaceAvailable" DOUBLE PRECISION NOT NULL,
    "status" "AbsorptionStatus" NOT NULL DEFAULT 'PENDING',
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedByRoute1At" TIMESTAMP(3),
    "acceptedByRoute2At" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsorptionOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsorptionTransfer" (
    "id" TEXT NOT NULL,
    "absorptionOpportunityId" TEXT NOT NULL,
    "exporterDriverId" TEXT NOT NULL,
    "importerDriverId" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "deliveryIdsToTransfer" TEXT NOT NULL,
    "exportedDeliveryId" TEXT,
    "importedDeliveryId" TEXT,
    "qrCodeScanned" BOOLEAN NOT NULL DEFAULT false,
    "qrCodeData" TEXT,
    "scannedAt" TIMESTAMP(3),
    "checklistData" JSONB,
    "photos" JSONB,
    "spaceAvailableExporter" DOUBLE PRECISION NOT NULL,
    "spaceAvailableImporter" DOUBLE PRECISION NOT NULL,
    "distanceSavedKm" DOUBLE PRECISION NOT NULL,
    "carbonSavedKg" DOUBLE PRECISION NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AbsorptionTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackhaulPickup" (
    "id" TEXT NOT NULL,
    "truckId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "shipperId" TEXT NOT NULL,
    "shipperName" TEXT NOT NULL,
    "shipperPhone" TEXT NOT NULL,
    "shipperLocation" TEXT NOT NULL,
    "shipperLat" DOUBLE PRECISION NOT NULL,
    "shipperLng" DOUBLE PRECISION NOT NULL,
    "destinationHubId" TEXT NOT NULL,
    "packageCount" INTEGER NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "totalVolume" DOUBLE PRECISION NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "carbonSavedKg" DOUBLE PRECISION NOT NULL,
    "status" "BackhaulStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pickedUpAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "BackhaulPickup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "shipperId" TEXT NOT NULL,
    "pickupLocation" TEXT,
    "pickupLat" DOUBLE PRECISION,
    "pickupLng" DOUBLE PRECISION,
    "pickupTime" TIMESTAMP(3),
    "dropLocation" TEXT,
    "dropLat" DOUBLE PRECISION,
    "dropLng" DOUBLE PRECISION,
    "dropTime" TIMESTAMP(3),
    "cargoType" TEXT,
    "cargoWeight" DOUBLE PRECISION,
    "cargoVolume" DOUBLE PRECISION,
    "specialInstructions" TEXT,
    "estimatedPrice" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'LOW',
    "isMarketplaceLoad" BOOLEAN NOT NULL DEFAULT false,
    "recipientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarbonMetric" (
    "id" TEXT NOT NULL,
    "courierCompanyId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "totalDeliveries" INTEGER NOT NULL,
    "totalOptimizedRoutes" INTEGER NOT NULL,
    "totalAbsorptions" INTEGER NOT NULL,
    "totalBackhauls" INTEGER NOT NULL,
    "baselineDistance" DOUBLE PRECISION NOT NULL,
    "actualDistance" DOUBLE PRECISION NOT NULL,
    "distanceSaved" DOUBLE PRECISION NOT NULL,
    "baselineCarbon" DOUBLE PRECISION NOT NULL,
    "actualCarbon" DOUBLE PRECISION NOT NULL,
    "carbonSaved" DOUBLE PRECISION NOT NULL,
    "emptyMilesPrevented" DOUBLE PRECISION NOT NULL,
    "avgUtilization" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarbonMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteCache" (
    "id" TEXT NOT NULL,
    "originLat" DOUBLE PRECISION NOT NULL,
    "originLng" DOUBLE PRECISION NOT NULL,
    "destLat" DOUBLE PRECISION NOT NULL,
    "destLng" DOUBLE PRECISION NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "polyline" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'google_maps',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RouteCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "route" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EWayBill" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "cargoValue" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" "EwbStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EWayBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "requests" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_gstin_key" ON "Customer"("gstin");

-- CreateIndex
CREATE INDEX "GPSLog_truckId_timestamp_idx" ON "GPSLog"("truckId", "timestamp");

-- CreateIndex
CREATE INDEX "GPSLog_latitude_longitude_idx" ON "GPSLog"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "VirtualHub_latitude_longitude_idx" ON "VirtualHub"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "AbsorptionOpportunity_route1Id_status_idx" ON "AbsorptionOpportunity"("route1Id", "status");

-- CreateIndex
CREATE INDEX "AbsorptionOpportunity_route2Id_status_idx" ON "AbsorptionOpportunity"("route2Id", "status");

-- CreateIndex
CREATE INDEX "AbsorptionOpportunity_nearestHubId_idx" ON "AbsorptionOpportunity"("nearestHubId");

-- CreateIndex
CREATE INDEX "AbsorptionOpportunity_status_expiresAt_idx" ON "AbsorptionOpportunity"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "AbsorptionOpportunity_overlapStartTime_idx" ON "AbsorptionOpportunity"("overlapStartTime");

-- CreateIndex
CREATE UNIQUE INDEX "AbsorptionTransfer_absorptionOpportunityId_key" ON "AbsorptionTransfer"("absorptionOpportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "AbsorptionTransfer_exportedDeliveryId_key" ON "AbsorptionTransfer"("exportedDeliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "AbsorptionTransfer_importedDeliveryId_key" ON "AbsorptionTransfer"("importedDeliveryId");

-- CreateIndex
CREATE INDEX "AbsorptionTransfer_exporterDriverId_idx" ON "AbsorptionTransfer"("exporterDriverId");

-- CreateIndex
CREATE INDEX "AbsorptionTransfer_importerDriverId_idx" ON "AbsorptionTransfer"("importerDriverId");

-- CreateIndex
CREATE INDEX "AbsorptionTransfer_hubId_idx" ON "AbsorptionTransfer"("hubId");

-- CreateIndex
CREATE INDEX "AbsorptionTransfer_status_idx" ON "AbsorptionTransfer"("status");

-- CreateIndex
CREATE INDEX "BackhaulPickup_truckId_status_idx" ON "BackhaulPickup"("truckId", "status");

-- CreateIndex
CREATE INDEX "BackhaulPickup_driverId_idx" ON "BackhaulPickup"("driverId");

-- CreateIndex
CREATE INDEX "BackhaulPickup_destinationHubId_idx" ON "BackhaulPickup"("destinationHubId");

-- CreateIndex
CREATE INDEX "CarbonMetric_date_idx" ON "CarbonMetric"("date");

-- CreateIndex
CREATE INDEX "CarbonMetric_courierCompanyId_idx" ON "CarbonMetric"("courierCompanyId");

-- CreateIndex
CREATE UNIQUE INDEX "CarbonMetric_courierCompanyId_date_key" ON "CarbonMetric"("courierCompanyId", "date");

-- CreateIndex
CREATE INDEX "RouteCache_expiresAt_idx" ON "RouteCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RouteCache_originLat_originLng_destLat_destLng_key" ON "RouteCache"("originLat", "originLng", "destLat", "destLng");

-- CreateIndex
CREATE UNIQUE INDEX "EWayBill_billNo_key" ON "EWayBill"("billNo");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_shipmentId_key" ON "Delivery"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Delivery_packageId_key" ON "Delivery"("packageId");

-- CreateIndex
CREATE INDEX "Delivery_postalCode_status_idx" ON "Delivery"("postalCode", "status");

-- CreateIndex
CREATE INDEX "Delivery_courierCompanyId_idx" ON "Delivery"("courierCompanyId");

-- CreateIndex
CREATE INDEX "Delivery_optimizedRouteId_idx" ON "Delivery"("optimizedRouteId");

-- CreateIndex
CREATE INDEX "Delivery_packageId_idx" ON "Delivery"("packageId");

-- CreateIndex
CREATE INDEX "Delivery_dispatcherId_idx" ON "Delivery"("dispatcherId");

-- CreateIndex
CREATE INDEX "Delivery_driverId_idx" ON "Delivery"("driverId");

-- CreateIndex
CREATE INDEX "Delivery_timeWindowStart_timeWindowEnd_idx" ON "Delivery"("timeWindowStart", "timeWindowEnd");

-- CreateIndex
CREATE INDEX "OptimizedRoute_courierCompanyId_status_idx" ON "OptimizedRoute"("courierCompanyId", "status");

-- CreateIndex
CREATE INDEX "Truck_ownerId_isAvailable_idx" ON "Truck"("ownerId", "isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "User_qrCode_key" ON "User"("qrCode");

-- CreateIndex
CREATE INDEX "User_courierCompanyId_registrationStatus_idx" ON "User"("courierCompanyId", "registrationStatus");

-- CreateIndex
CREATE INDEX "User_qrCode_idx" ON "User"("qrCode");

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_sourceHubId_fkey" FOREIGN KEY ("sourceHubId") REFERENCES "VirtualHub"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSLog" ADD CONSTRAINT "GPSLog_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_dispatcherId_fkey" FOREIGN KEY ("dispatcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedRoute" ADD CONSTRAINT "OptimizedRoute_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionOpportunity" ADD CONSTRAINT "AbsorptionOpportunity_route1Id_fkey" FOREIGN KEY ("route1Id") REFERENCES "OptimizedRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionOpportunity" ADD CONSTRAINT "AbsorptionOpportunity_route2Id_fkey" FOREIGN KEY ("route2Id") REFERENCES "OptimizedRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionOpportunity" ADD CONSTRAINT "AbsorptionOpportunity_nearestHubId_fkey" FOREIGN KEY ("nearestHubId") REFERENCES "VirtualHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionTransfer" ADD CONSTRAINT "AbsorptionTransfer_absorptionOpportunityId_fkey" FOREIGN KEY ("absorptionOpportunityId") REFERENCES "AbsorptionOpportunity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionTransfer" ADD CONSTRAINT "AbsorptionTransfer_exporterDriverId_fkey" FOREIGN KEY ("exporterDriverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionTransfer" ADD CONSTRAINT "AbsorptionTransfer_importerDriverId_fkey" FOREIGN KEY ("importerDriverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionTransfer" ADD CONSTRAINT "AbsorptionTransfer_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "VirtualHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionTransfer" ADD CONSTRAINT "AbsorptionTransfer_exportedDeliveryId_fkey" FOREIGN KEY ("exportedDeliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsorptionTransfer" ADD CONSTRAINT "AbsorptionTransfer_importedDeliveryId_fkey" FOREIGN KEY ("importedDeliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackhaulPickup" ADD CONSTRAINT "BackhaulPickup_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackhaulPickup" ADD CONSTRAINT "BackhaulPickup_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackhaulPickup" ADD CONSTRAINT "BackhaulPickup_destinationHubId_fkey" FOREIGN KEY ("destinationHubId") REFERENCES "VirtualHub"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EWayBill" ADD CONSTRAINT "EWayBill_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
