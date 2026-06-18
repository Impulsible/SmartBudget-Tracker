CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
    "ProductVersion" TEXT NOT NULL
);

BEGIN TRANSACTION;
CREATE TABLE "AspNetRoles" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetRoles" PRIMARY KEY,
    "Name" TEXT NULL,
    "NormalizedName" TEXT NULL,
    "ConcurrencyStamp" TEXT NULL
);

CREATE TABLE "AspNetUsers" (
    "Id" TEXT NOT NULL CONSTRAINT "PK_AspNetUsers" PRIMARY KEY,
    "UserName" TEXT NULL,
    "NormalizedUserName" TEXT NULL,
    "Email" TEXT NULL,
    "NormalizedEmail" TEXT NULL,
    "EmailConfirmed" INTEGER NOT NULL,
    "PasswordHash" TEXT NULL,
    "SecurityStamp" TEXT NULL,
    "ConcurrencyStamp" TEXT NULL,
    "PhoneNumber" TEXT NULL,
    "PhoneNumberConfirmed" INTEGER NOT NULL,
    "TwoFactorEnabled" INTEGER NOT NULL,
    "LockoutEnd" TEXT NULL,
    "LockoutEnabled" INTEGER NOT NULL,
    "AccessFailedCount" INTEGER NOT NULL
);

CREATE TABLE "Categories" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Categories" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Color" TEXT NOT NULL,
    "Icon" TEXT NOT NULL,
    "IsDefault" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL
);

CREATE TABLE "SavingsGoals" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SavingsGoals" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "TargetAmount" TEXT NOT NULL,
    "CurrentAmount" TEXT NOT NULL,
    "Color" TEXT NOT NULL,
    "Icon" TEXT NOT NULL,
    "TargetDate" TEXT NOT NULL,
    "Status" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL
);

CREATE TABLE "AspNetRoleClaims" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetRoleClaims" PRIMARY KEY AUTOINCREMENT,
    "RoleId" TEXT NOT NULL,
    "ClaimType" TEXT NULL,
    "ClaimValue" TEXT NULL,
    CONSTRAINT "FK_AspNetRoleClaims_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AspNetUserClaims" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_AspNetUserClaims" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "ClaimType" TEXT NULL,
    "ClaimValue" TEXT NULL,
    CONSTRAINT "FK_AspNetUserClaims_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AspNetUserLogins" (
    "LoginProvider" TEXT NOT NULL,
    "ProviderKey" TEXT NOT NULL,
    "ProviderDisplayName" TEXT NULL,
    "UserId" TEXT NOT NULL,
    CONSTRAINT "PK_AspNetUserLogins" PRIMARY KEY ("LoginProvider", "ProviderKey"),
    CONSTRAINT "FK_AspNetUserLogins_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AspNetUserRoles" (
    "UserId" TEXT NOT NULL,
    "RoleId" TEXT NOT NULL,
    CONSTRAINT "PK_AspNetUserRoles" PRIMARY KEY ("UserId", "RoleId"),
    CONSTRAINT "FK_AspNetUserRoles_AspNetRoles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "AspNetRoles" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_AspNetUserRoles_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "AspNetUserTokens" (
    "UserId" TEXT NOT NULL,
    "LoginProvider" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Value" TEXT NULL,
    CONSTRAINT "PK_AspNetUserTokens" PRIMARY KEY ("UserId", "LoginProvider", "Name"),
    CONSTRAINT "FK_AspNetUserTokens_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

CREATE TABLE "Budgets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Budgets" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Amount" TEXT NOT NULL,
    "Color" TEXT NOT NULL,
    "CategoryId" INTEGER NULL,
    "Month" INTEGER NOT NULL,
    "Year" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_Budgets_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id")
);

CREATE TABLE "Transactions" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Transactions" PRIMARY KEY AUTOINCREMENT,
    "UserId" TEXT NOT NULL,
    "Title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "Amount" TEXT NOT NULL,
    "Date" TEXT NOT NULL,
    "Type" INTEGER NOT NULL,
    "CategoryId" INTEGER NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    CONSTRAINT "FK_Transactions_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id")
);

CREATE INDEX "IX_AspNetRoleClaims_RoleId" ON "AspNetRoleClaims" ("RoleId");

CREATE UNIQUE INDEX "RoleNameIndex" ON "AspNetRoles" ("NormalizedName");

CREATE INDEX "IX_AspNetUserClaims_UserId" ON "AspNetUserClaims" ("UserId");

CREATE INDEX "IX_AspNetUserLogins_UserId" ON "AspNetUserLogins" ("UserId");

CREATE INDEX "IX_AspNetUserRoles_RoleId" ON "AspNetUserRoles" ("RoleId");

CREATE INDEX "EmailIndex" ON "AspNetUsers" ("NormalizedEmail");

CREATE UNIQUE INDEX "UserNameIndex" ON "AspNetUsers" ("NormalizedUserName");

CREATE INDEX "IX_Budgets_CategoryId" ON "Budgets" ("CategoryId");

CREATE UNIQUE INDEX "IX_Budgets_UserId_CategoryId_Year_Month" ON "Budgets" ("UserId", "CategoryId", "Year", "Month");

CREATE UNIQUE INDEX "IX_Categories_UserId_Name" ON "Categories" ("UserId", "Name");

CREATE INDEX "IX_Transactions_CategoryId" ON "Transactions" ("CategoryId");

CREATE INDEX "IX_Transactions_UserId_Date" ON "Transactions" ("UserId", "Date");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260616005148_InitialCreate', '9.0.0');

CREATE TABLE "ef_temp_Budgets" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Budgets" PRIMARY KEY AUTOINCREMENT,
    "Amount" decimal(18,2) NOT NULL,
    "CategoryId" INTEGER NULL,
    "Color" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Month" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "Year" INTEGER NOT NULL,
    CONSTRAINT "FK_Budgets_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_Budgets_Categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES "Categories" ("Id")
);

INSERT INTO "ef_temp_Budgets" ("Id", "Amount", "CategoryId", "Color", "CreatedAt", "Month", "Name", "UpdatedAt", "UserId", "Year")
SELECT "Id", "Amount", "CategoryId", "Color", "CreatedAt", "Month", "Name", "UpdatedAt", "UserId", "Year"
FROM "Budgets";

CREATE TABLE "ef_temp_Categories" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_Categories" PRIMARY KEY AUTOINCREMENT,
    "Color" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "Icon" TEXT NOT NULL,
    "IsDefault" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    CONSTRAINT "FK_Categories_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

INSERT INTO "ef_temp_Categories" ("Id", "Color", "CreatedAt", "Icon", "IsDefault", "Name", "UserId")
SELECT "Id", "Color", "CreatedAt", "Icon", "IsDefault", "Name", "UserId"
FROM "Categories";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;
DROP TABLE "Budgets";

ALTER TABLE "ef_temp_Budgets" RENAME TO "Budgets";

DROP TABLE "Categories";

ALTER TABLE "ef_temp_Categories" RENAME TO "Categories";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;
CREATE INDEX "IX_Budgets_CategoryId" ON "Budgets" ("CategoryId");

CREATE UNIQUE INDEX "IX_Budgets_UserId_CategoryId_Year_Month" ON "Budgets" ("UserId", "CategoryId", "Year", "Month");

CREATE UNIQUE INDEX "IX_Categories_UserId_Name" ON "Categories" ("UserId", "Name");

COMMIT;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260616010925_AddCategoryFields', '9.0.0');

BEGIN TRANSACTION;
ALTER TABLE "SavingsGoals" RENAME COLUMN "Status" TO "IsCompleted";

CREATE INDEX "IX_Transactions_Type" ON "Transactions" ("Type");

CREATE INDEX "IX_SavingsGoals_UserId_IsCompleted" ON "SavingsGoals" ("UserId", "IsCompleted");

CREATE TABLE "ef_temp_SavingsGoals" (
    "Id" INTEGER NOT NULL CONSTRAINT "PK_SavingsGoals" PRIMARY KEY AUTOINCREMENT,
    "Color" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "CurrentAmount" TEXT NOT NULL,
    "Icon" TEXT NOT NULL,
    "IsCompleted" INTEGER NOT NULL,
    "Name" TEXT NOT NULL,
    "TargetAmount" TEXT NOT NULL,
    "TargetDate" TEXT NULL,
    "UpdatedAt" TEXT NULL,
    "UserId" TEXT NOT NULL,
    CONSTRAINT "FK_SavingsGoals_AspNetUsers_UserId" FOREIGN KEY ("UserId") REFERENCES "AspNetUsers" ("Id") ON DELETE CASCADE
);

INSERT INTO "ef_temp_SavingsGoals" ("Id", "Color", "CreatedAt", "CurrentAmount", "Icon", "IsCompleted", "Name", "TargetAmount", "TargetDate", "UpdatedAt", "UserId")
SELECT "Id", "Color", "CreatedAt", "CurrentAmount", "Icon", "IsCompleted", "Name", "TargetAmount", "TargetDate", "UpdatedAt", "UserId"
FROM "SavingsGoals";

COMMIT;

PRAGMA foreign_keys = 0;

BEGIN TRANSACTION;
DROP TABLE "SavingsGoals";

ALTER TABLE "ef_temp_SavingsGoals" RENAME TO "SavingsGoals";

COMMIT;

PRAGMA foreign_keys = 1;

BEGIN TRANSACTION;
CREATE INDEX "IX_SavingsGoals_UserId_IsCompleted" ON "SavingsGoals" ("UserId", "IsCompleted");

COMMIT;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260618131337_AddSavingsGoals', '9.0.0');

BEGIN TRANSACTION;
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260618143248_AddSavingsGoalsTable', '9.0.0');

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260618143451_CreateSavingsGoalsTable', '9.0.0');

COMMIT;

