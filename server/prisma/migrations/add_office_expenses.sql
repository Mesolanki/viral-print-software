-- ============================================================
-- Migration: add_office_expenses
-- Created: 2026-07-28
-- Description: Adds ExpenseCategory and OfficeExpense tables
--              for tracking office/overhead expenses.
-- ============================================================

-- CreateTable: expense_categories
CREATE TABLE "expense_categories" (
    "id"          SERIAL NOT NULL,
    "company_id"  INTEGER NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "is_active"   BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: office_expenses
CREATE TABLE "office_expenses" (
    "id"           SERIAL NOT NULL,
    "company_id"   INTEGER NOT NULL,
    "category_id"  INTEGER NOT NULL,
    "title"        TEXT NOT NULL,
    "amount"       DECIMAL(12,2) NOT NULL,
    "payment_mode" "PaymentType" NOT NULL DEFAULT 'CASH',
    "expense_date" TIMESTAMP(3) NOT NULL,
    "reference_no" TEXT,
    "vendor_name"  TEXT,
    "notes"        TEXT,
    "recorded_by"  INTEGER NOT NULL,
    "receipt_url"  TEXT,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "office_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique category name per company
CREATE UNIQUE INDEX "expense_categories_company_id_name_key"
    ON "expense_categories"("company_id", "name");

-- CreateIndex: performance indexes on office_expenses
CREATE INDEX "office_expenses_company_id_expense_date_idx"
    ON "office_expenses"("company_id", "expense_date");

CREATE INDEX "office_expenses_company_id_category_id_idx"
    ON "office_expenses"("company_id", "category_id");

-- AddForeignKey: expense_categories -> companies
ALTER TABLE "expense_categories"
    ADD CONSTRAINT "expense_categories_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: office_expenses -> companies
ALTER TABLE "office_expenses"
    ADD CONSTRAINT "office_expenses_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: office_expenses -> expense_categories
ALTER TABLE "office_expenses"
    ADD CONSTRAINT "office_expenses_category_id_fkey"
    FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: office_expenses -> users (recorder)
ALTER TABLE "office_expenses"
    ADD CONSTRAINT "office_expenses_recorded_by_fkey"
    FOREIGN KEY ("recorded_by") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
