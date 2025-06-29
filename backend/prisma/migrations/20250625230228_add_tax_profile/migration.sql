/*
  Warnings:

  - You are about to drop the `medical_certifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_receipts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tax_periods` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `glutenFreePrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `regularPrice` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `storeName` on the `products` table. All the data in the column will be lost.
  - Added the required column `eligibleAmount` to the `receipts` table without a default value. This is not possible if the table is not empty.
  - Made the column `storeName` on table `receipts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `receipts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "product_receipts_productId_receiptId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "medical_certifications";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "product_receipts";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tax_periods";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "receipt_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "purchasedProductId" TEXT,
    "comparisonProductId" TEXT,
    "comparisonPrice" REAL,
    "incrementalCost" REAL,
    "receiptId" TEXT NOT NULL,
    CONSTRAINT "receipt_items_purchasedProductId_fkey" FOREIGN KEY ("purchasedProductId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "receipt_items_comparisonProductId_fkey" FOREIGN KEY ("comparisonProductId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "receipt_items_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "receipts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medical_expenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "medical_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "netIncome" REAL,
    "dependantIncome" REAL,
    "claimingFor" TEXT NOT NULL DEFAULT 'self',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "tax_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT true,
    "price" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_products" ("brand", "category", "createdAt", "id", "name", "notes", "updatedAt", "userId") SELECT "brand", "category", "createdAt", "id", "name", "notes", "updatedAt", "userId" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE TABLE "new_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storeName" TEXT NOT NULL,
    "receiptDate" DATETIME NOT NULL,
    "totalAmount" REAL NOT NULL,
    "eligibleAmount" REAL NOT NULL,
    "imageUrl" TEXT,
    "notes" TEXT,
    "filePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_receipts" ("createdAt", "filePath", "id", "notes", "receiptDate", "storeName", "totalAmount", "updatedAt", "userId") SELECT "createdAt", "filePath", "id", "notes", "receiptDate", "storeName", "totalAmount", "updatedAt", "userId" FROM "receipts";
DROP TABLE "receipts";
ALTER TABLE "new_receipts" RENAME TO "receipts";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("createdAt", "email", "id", "name", "password", "updatedAt") SELECT "createdAt", "email", "id", "name", "password", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "tax_profiles_userId_year_key" ON "tax_profiles"("userId", "year");
