/*
  Warnings:

  - You are about to drop the `PaymentInfo` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RescueRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `errorCode` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PaymentInfo";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "petId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "formData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("createdAt", "formData", "id", "petId", "status", "updatedAt", "userId") SELECT "createdAt", "formData", "id", "petId", "status", "updatedAt", "userId" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
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
CREATE TABLE "new_Transaction" (
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
INSERT INTO "new_Transaction" ("amount", "createdAt", "currency", "gateway", "gatewayTransactionId", "id", "kind", "paymentDetails", "promotionId", "rescueRequestId", "status") SELECT "amount", "createdAt", "currency", "gateway", "gatewayTransactionId", "id", "kind", "paymentDetails", "promotionId", "rescueRequestId", "status" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE UNIQUE INDEX "Transaction_gatewayTransactionId_key" ON "Transaction"("gatewayTransactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
