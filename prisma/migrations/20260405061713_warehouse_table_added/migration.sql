/*
  Warnings:

  - The values [AWAITING_CONFIRMATION,ABSORPTION_PROPOSED,ABSORPTION_ACCEPTED,ABSORPTION_TRANSFERRED] on the enum `DeliveryStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `absorptionBonus` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `baseEarnings` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `baselineDistance` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `carbonEmitted` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `cargoType` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `cargoVolumeLtrs` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `dispatcherId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `distanceKm` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `distanceTraveled` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `dropTime` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedETA` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `fuelSurcharge` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `isMarketplaceLoad` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `marketplaceBonus` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `packageCount` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `packageId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `pickupTime` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `shipmentId` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `timeWindowEnd` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `timeWindowStart` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `totalEarnings` on the `Delivery` table. All the data in the column will be lost.
  - You are about to drop the column `baselineDistance` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `carbonSaved` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `emptyMilesSaved` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `isTSPOptimized` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `routePolyline` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `totalPackages` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `totalVolume` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeight` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `utilizationPercent` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `waypoints` on the `OptimizedRoute` table. All the data in the column will be lost.
  - You are about to drop the column `co2PerKm` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `currentVolume` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `currentWeight` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `fuelConsumption` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `fuelLevel` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `fuelType` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `gstin` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `maxVolume` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `maxWeight` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `mileage` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `nextService` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `registeredAt` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `sourceHubId` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Truck` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `avatarColor` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `currentVehicleNo` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `deliveriesCount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `homeBaseCity` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `initials` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastActiveDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `qrCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `registeredAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `registrationStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalDistanceKm` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalEarnings` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalHoursWorked` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `vehicleType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weekResetDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyEarnings` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyKmDriven` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AbsorptionOpportunity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AbsorptionTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BackhaulPickup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CarbonMetric` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Customer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EWayBill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GPSLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RouteCache` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Shipment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VirtualHub` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endLat` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endLng` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLat` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startLng` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `OptimizedRoute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `Truck` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeliveryStatus_new" AS ENUM ('PENDING', 'ALLOCATED', 'EN_ROUTE_TO_PICKUP', 'CARGO_LOADED', 'IN_TRANSIT', 'EN_ROUTE_TO_DROP', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."Delivery" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Delivery" ALTER COLUMN "status" TYPE "DeliveryStatus_new" USING ("status"::text::"DeliveryStatus_new");
ALTER TYPE "DeliveryStatus" RENAME TO "DeliveryStatus_old";
ALTER TYPE "DeliveryStatus_new" RENAME TO "DeliveryStatus";
DROP TYPE "public"."DeliveryStatus_old";
ALTER TABLE "Delivery" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "AbsorptionOpportunity" DROP CONSTRAINT "AbsorptionOpportunity_nearestHubId_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionOpportunity" DROP CONSTRAINT "AbsorptionOpportunity_route1Id_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionOpportunity" DROP CONSTRAINT "AbsorptionOpportunity_route2Id_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionTransfer" DROP CONSTRAINT "AbsorptionTransfer_absorptionOpportunityId_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionTransfer" DROP CONSTRAINT "AbsorptionTransfer_exportedDeliveryId_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionTransfer" DROP CONSTRAINT "AbsorptionTransfer_exporterDriverId_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionTransfer" DROP CONSTRAINT "AbsorptionTransfer_hubId_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionTransfer" DROP CONSTRAINT "AbsorptionTransfer_importedDeliveryId_fkey";

-- DropForeignKey
ALTER TABLE "AbsorptionTransfer" DROP CONSTRAINT "AbsorptionTransfer_importerDriverId_fkey";

-- DropForeignKey
ALTER TABLE "BackhaulPickup" DROP CONSTRAINT "BackhaulPickup_destinationHubId_fkey";

-- DropForeignKey
ALTER TABLE "BackhaulPickup" DROP CONSTRAINT "BackhaulPickup_driverId_fkey";

-- DropForeignKey
ALTER TABLE "BackhaulPickup" DROP CONSTRAINT "BackhaulPickup_truckId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_dispatcherId_fkey";

-- DropForeignKey
ALTER TABLE "Delivery" DROP CONSTRAINT "Delivery_shipmentId_fkey";

-- DropForeignKey
ALTER TABLE "EWayBill" DROP CONSTRAINT "EWayBill_driverId_fkey";

-- DropForeignKey
ALTER TABLE "GPSLog" DROP CONSTRAINT "GPSLog_truckId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Shipment" DROP CONSTRAINT "Shipment_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "Shipment" DROP CONSTRAINT "Shipment_shipperId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_deliveryId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Truck" DROP CONSTRAINT "Truck_sourceHubId_fkey";

-- DropIndex
DROP INDEX "Delivery_courierCompanyId_idx";

-- DropIndex
DROP INDEX "Delivery_dispatcherId_idx";

-- DropIndex
DROP INDEX "Delivery_driverId_idx";

-- DropIndex
DROP INDEX "Delivery_optimizedRouteId_idx";

-- DropIndex
DROP INDEX "Delivery_packageId_idx";

-- DropIndex
DROP INDEX "Delivery_packageId_key";

-- DropIndex
DROP INDEX "Delivery_postalCode_status_idx";

-- DropIndex
DROP INDEX "Delivery_shipmentId_key";

-- DropIndex
DROP INDEX "Delivery_timeWindowStart_timeWindowEnd_idx";

-- DropIndex
DROP INDEX "OptimizedRoute_courierCompanyId_status_idx";

-- DropIndex
DROP INDEX "OptimizedRoute_createdAt_idx";

-- DropIndex
DROP INDEX "OptimizedRoute_estimatedStartTime_idx";

-- DropIndex
DROP INDEX "OptimizedRoute_truckId_status_idx";

-- DropIndex
DROP INDEX "Truck_courierCompanyId_registrationStatus_idx";

-- DropIndex
DROP INDEX "Truck_currentLat_currentLng_idx";

-- DropIndex
DROP INDEX "Truck_ownerId_isAvailable_idx";

-- DropIndex
DROP INDEX "Truck_sourceHubId_idx";

-- DropIndex
DROP INDEX "User_courierCompanyId_registrationStatus_idx";

-- DropIndex
DROP INDEX "User_qrCode_idx";

-- DropIndex
DROP INDEX "User_qrCode_key";

-- AlterTable
ALTER TABLE "Delivery" DROP COLUMN "absorptionBonus",
DROP COLUMN "baseEarnings",
DROP COLUMN "baselineDistance",
DROP COLUMN "carbonEmitted",
DROP COLUMN "cargoType",
DROP COLUMN "cargoVolumeLtrs",
DROP COLUMN "completedAt",
DROP COLUMN "dispatcherId",
DROP COLUMN "distanceKm",
DROP COLUMN "distanceTraveled",
DROP COLUMN "dropTime",
DROP COLUMN "estimatedETA",
DROP COLUMN "fuelSurcharge",
DROP COLUMN "isMarketplaceLoad",
DROP COLUMN "marketplaceBonus",
DROP COLUMN "packageCount",
DROP COLUMN "packageId",
DROP COLUMN "pickupTime",
DROP COLUMN "postalCode",
DROP COLUMN "shipmentId",
DROP COLUMN "timeWindowEnd",
DROP COLUMN "timeWindowStart",
DROP COLUMN "totalEarnings";

-- AlterTable
ALTER TABLE "OptimizedRoute" DROP COLUMN "baselineDistance",
DROP COLUMN "carbonSaved",
DROP COLUMN "completedAt",
DROP COLUMN "emptyMilesSaved",
DROP COLUMN "isTSPOptimized",
DROP COLUMN "routePolyline",
DROP COLUMN "startedAt",
DROP COLUMN "totalPackages",
DROP COLUMN "totalVolume",
DROP COLUMN "totalWeight",
DROP COLUMN "utilizationPercent",
DROP COLUMN "waypoints",
ADD COLUMN     "endLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "endLng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "startLat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "startLng" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "warehouseId" TEXT NOT NULL,
ALTER COLUMN "totalDistance" DROP DEFAULT,
ALTER COLUMN "totalDuration" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Truck" DROP COLUMN "co2PerKm",
DROP COLUMN "currentVolume",
DROP COLUMN "currentWeight",
DROP COLUMN "fuelConsumption",
DROP COLUMN "fuelLevel",
DROP COLUMN "fuelType",
DROP COLUMN "gstin",
DROP COLUMN "maxVolume",
DROP COLUMN "maxWeight",
DROP COLUMN "mileage",
DROP COLUMN "nextService",
DROP COLUMN "registeredAt",
DROP COLUMN "registrationStatus",
DROP COLUMN "sourceHubId",
DROP COLUMN "type",
ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "approvedBy",
DROP COLUMN "avatarColor",
DROP COLUMN "currentVehicleNo",
DROP COLUMN "deliveriesCount",
DROP COLUMN "homeBaseCity",
DROP COLUMN "initials",
DROP COLUMN "lastActiveDate",
DROP COLUMN "qrCode",
DROP COLUMN "rating",
DROP COLUMN "registeredAt",
DROP COLUMN "registrationStatus",
DROP COLUMN "status",
DROP COLUMN "totalDistanceKm",
DROP COLUMN "totalEarnings",
DROP COLUMN "totalHoursWorked",
DROP COLUMN "vehicleType",
DROP COLUMN "weekResetDate",
DROP COLUMN "weeklyEarnings",
DROP COLUMN "weeklyKmDriven";

-- DropTable
DROP TABLE "AbsorptionOpportunity";

-- DropTable
DROP TABLE "AbsorptionTransfer";

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "BackhaulPickup";

-- DropTable
DROP TABLE "CarbonMetric";

-- DropTable
DROP TABLE "Customer";

-- DropTable
DROP TABLE "EWayBill";

-- DropTable
DROP TABLE "GPSLog";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "RouteCache";

-- DropTable
DROP TABLE "Shipment";

-- DropTable
DROP TABLE "SystemConfig";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "VirtualHub";

-- DropEnum
DROP TYPE "AbsorptionStatus";

-- DropEnum
DROP TYPE "BackhaulStatus";

-- DropEnum
DROP TYPE "EwbStatus";

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "Priority";

-- DropEnum
DROP TYPE "ShipmentStatus";

-- DropEnum
DROP TYPE "TransactionType";

-- DropEnum
DROP TYPE "TransferStatus";

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "adminEmail" TEXT,
    "adminPhone" TEXT,
    "courierCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Warehouse_courierCompanyId_idx" ON "Warehouse"("courierCompanyId");

-- CreateIndex
CREATE INDEX "Warehouse_latitude_longitude_idx" ON "Warehouse"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "OptimizedRoute_warehouseId_idx" ON "OptimizedRoute"("warehouseId");

-- CreateIndex
CREATE INDEX "OptimizedRoute_truckId_idx" ON "OptimizedRoute"("truckId");

-- CreateIndex
CREATE INDEX "Truck_warehouseId_idx" ON "Truck"("warehouseId");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_courierCompanyId_fkey" FOREIGN KEY ("courierCompanyId") REFERENCES "CourierCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizedRoute" ADD CONSTRAINT "OptimizedRoute_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
