-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referenceNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "gallery" TEXT NOT NULL,
    "rescueId" TEXT NOT NULL,
    "isAdopted" BOOLEAN NOT NULL DEFAULT false,
    "isPromoted" BOOLEAN NOT NULL DEFAULT false,
    "dateListed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pet_rescueId_fkey" FOREIGN KEY ("rescueId") REFERENCES "Rescue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pet" ("age", "createdAt", "dateListed", "description", "gallery", "id", "imageUrl", "internalNotes", "isAdopted", "name", "referenceNumber", "rescueId", "size", "species", "updatedAt") SELECT "age", "createdAt", "dateListed", "description", "gallery", "id", "imageUrl", "internalNotes", "isAdopted", "name", "referenceNumber", "rescueId", "size", "species", "updatedAt" FROM "Pet";
DROP TABLE "Pet";
ALTER TABLE "new_Pet" RENAME TO "Pet";
CREATE UNIQUE INDEX "Pet_referenceNumber_key" ON "Pet"("referenceNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
