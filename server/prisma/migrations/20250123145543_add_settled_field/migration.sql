-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SplitExpenseParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "splitExpenseId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "share" REAL NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SplitExpenseParticipant_splitExpenseId_fkey" FOREIGN KEY ("splitExpenseId") REFERENCES "SplitExpense" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SplitExpenseParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SplitExpenseParticipant" ("createdAt", "id", "share", "splitExpenseId", "updatedAt", "userId") SELECT "createdAt", "id", "share", "splitExpenseId", "updatedAt", "userId" FROM "SplitExpenseParticipant";
DROP TABLE "SplitExpenseParticipant";
ALTER TABLE "new_SplitExpenseParticipant" RENAME TO "SplitExpenseParticipant";
CREATE UNIQUE INDEX "SplitExpenseParticipant_splitExpenseId_userId_key" ON "SplitExpenseParticipant"("splitExpenseId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
