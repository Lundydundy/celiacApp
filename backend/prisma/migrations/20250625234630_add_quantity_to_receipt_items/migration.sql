-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_receipt_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
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
INSERT INTO "new_receipt_items" ("comparisonPrice", "comparisonProductId", "id", "incrementalCost", "isEligible", "name", "price", "purchasedProductId", "receiptId") SELECT "comparisonPrice", "comparisonProductId", "id", "incrementalCost", "isEligible", "name", "price", "purchasedProductId", "receiptId" FROM "receipt_items";
DROP TABLE "receipt_items";
ALTER TABLE "new_receipt_items" RENAME TO "receipt_items";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
