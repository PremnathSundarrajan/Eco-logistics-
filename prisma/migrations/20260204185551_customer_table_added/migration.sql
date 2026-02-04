-- AlterTable
ALTER TABLE "CourierCompany" ADD COLUMN     "gstin" TEXT;

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "recipientId" TEXT;

-- AlterTable
ALTER TABLE "Truck" ADD COLUMN     "gstin" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "Customer_gstin_key" ON "Customer"("gstin");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
