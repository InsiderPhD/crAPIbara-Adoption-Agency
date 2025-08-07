/*
  Warnings:

  - The primary key for the `Application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `Application` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `RescueRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `RescueRequest` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "errorCode" TEXT;

-- CreateTable
CREATE TABLE "PaymentInfo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "cvv" TEXT NOT NULL,
    "cardholderName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
