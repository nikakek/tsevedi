-- CreateEnum
CREATE TYPE "PlaceKind" AS ENUM ('CITY', 'TOWN', 'VILLAGE', 'RESORT', 'AIRPORT', 'BORDER');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('MARSHRUTKA', 'MINIVAN', 'SEDAN', 'SUV', 'BUS');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('KA', 'RU', 'EN', 'TR', 'HY', 'AZ');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RideOutcome" AS ENUM ('WORKED', 'DIFFERENT', 'DID_NOT_RUN');

-- CreateEnum
CREATE TYPE "ProblemKind" AS ENUM ('WRONG_TIME', 'WRONG_PRICE', 'NOT_RUNNING', 'WRONG_PHONE', 'OTHER');

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameKa" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "aliases" TEXT[],
    "region" TEXT NOT NULL,
    "kind" "PlaceKind" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "viber" BOOLEAN NOT NULL DEFAULT false,
    "telegram" BOOLEAN NOT NULL DEFAULT false,
    "languages" "Language"[],
    "vehicleType" "VehicleType" NOT NULL,
    "vehicleModel" TEXT,
    "vehicleColor" TEXT,
    "plate" TEXT,
    "seats" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "days" INTEGER[],
    "activeMonths" INTEGER[],
    "departurePoint" TEXT NOT NULL,
    "departureMapsUrl" TEXT,
    "returnTime" TEXT,
    "returnPoint" TEXT,
    "pricePerSeat" INTEGER,
    "priceWholeVehicle" INTEGER,
    "largeLuggage" BOOLEAN,
    "callAhead" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'PENDING',
    "submittedByDriver" BOOLEAN NOT NULL DEFAULT false,
    "submitterContact" TEXT,
    "adminNote" TEXT,
    "lastConfirmedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideReport" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "travelDate" DATE NOT NULL,
    "outcome" "RideOutcome" NOT NULL,
    "departedAt" TEXT,
    "pricePaid" INTEGER,
    "comment" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemReport" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "kind" "ProblemKind" NOT NULL,
    "message" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Place_slug_key" ON "Place"("slug");

-- CreateIndex
CREATE INDEX "Driver_phone_idx" ON "Driver"("phone");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_driverId_idx" ON "Listing"("driverId");

-- CreateIndex
CREATE INDEX "RouteStop_placeId_idx" ON "RouteStop"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "RouteStop_listingId_position_key" ON "RouteStop"("listingId", "position");

-- CreateIndex
CREATE INDEX "RideReport_listingId_hidden_idx" ON "RideReport"("listingId", "hidden");

-- CreateIndex
CREATE INDEX "ProblemReport_resolved_idx" ON "ProblemReport"("resolved");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideReport" ADD CONSTRAINT "RideReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemReport" ADD CONSTRAINT "ProblemReport_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
