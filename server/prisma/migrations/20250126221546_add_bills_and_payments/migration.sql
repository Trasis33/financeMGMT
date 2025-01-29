-- CreateTable
CREATE TABLE "Bill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "creatorId" INTEGER NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPeriod" TEXT,
    "category" TEXT NOT NULL DEFAULT 'OTHER',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bill_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "share" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillParticipant_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BillPayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "billId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BillPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "BillParticipant_billId_userId_key" ON "BillParticipant"("billId", "userId");
