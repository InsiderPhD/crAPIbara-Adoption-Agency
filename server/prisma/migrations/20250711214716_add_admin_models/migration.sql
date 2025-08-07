/*
  Warnings:

  - You are about to drop the column `createdAt` on the `RescueRequest` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `RescueRequest` table. All the data in the column will be lost.
  - You are about to alter the column `amountPaid` on the `RescueRequest` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.
  - You are about to alter the column `requiredFee` on the `RescueRequest` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Float`.

*/
-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promotionId" TEXT,
    "rescueRequestId" TEXT,
    "kind" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gatewayTransactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentDetails" TEXT
);

-- CreateTable
CREATE TABLE "CouponCode" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "discountType" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesTo" TEXT NOT NULL,
    "maxUses" INTEGER,
    "timesUsed" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RescueRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "rescueName" TEXT NOT NULL,
    "rescueLocation" TEXT NOT NULL,
    "couponCode" TEXT,
    "requiredFee" REAL NOT NULL DEFAULT 0,
    "amountPaid" REAL NOT NULL DEFAULT 0,
    "approvalDate" DATETIME,
    "adminNotes" TEXT,
    CONSTRAINT "RescueRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RescueRequest" ("adminNotes", "amountPaid", "approvalDate", "couponCode", "id", "reason", "requestDate", "requiredFee", "rescueLocation", "rescueName", "status", "userId") SELECT "adminNotes", "amountPaid", "approvalDate", "couponCode", "id", "reason", "requestDate", "requiredFee", "rescueLocation", "rescueName", "status", "userId" FROM "RescueRequest";
DROP TABLE "RescueRequest";
ALTER TABLE "new_RescueRequest" RENAME TO "RescueRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_gatewayTransactionId_key" ON "Transaction"("gatewayTransactionId");
