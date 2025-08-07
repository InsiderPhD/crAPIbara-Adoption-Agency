/*
  Warnings:

  - You are about to drop the `CouponCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RescueRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLogin" DATETIME;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CouponCode";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "RescueRequest";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Transaction";
PRAGMA foreign_keys=on;
