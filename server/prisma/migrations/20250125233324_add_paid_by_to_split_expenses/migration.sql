-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- First create the new table with paidById as nullable
CREATE TABLE "new_SplitExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "paidById" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SplitExpense_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy existing data, using creatorId as paidById
INSERT INTO "new_SplitExpense" ("id", "description", "amount", "date", "creatorId", "paidById", "createdAt", "updatedAt")
SELECT "id", "description", "amount", "date", "creatorId", "creatorId", "createdAt", "updatedAt"
FROM "SplitExpense";

-- Drop the old table
DROP TABLE "SplitExpense";

-- Rename the new table
ALTER TABLE "new_SplitExpense" RENAME TO "SplitExpense";

-- Now make paidById required by creating another new table
CREATE TABLE "new_SplitExpense2" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "paidById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SplitExpense_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitExpense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy the data from the temporary table
INSERT INTO "new_SplitExpense2" SELECT * FROM "SplitExpense";

-- Drop the temporary table
DROP TABLE "SplitExpense";

-- Rename the final table
ALTER TABLE "new_SplitExpense2" RENAME TO "SplitExpense";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
