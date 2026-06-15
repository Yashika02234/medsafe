-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notification_preference" TEXT NOT NULL DEFAULT 'email',
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_given_at" TIMESTAMPTZ,
    "consent_text_version" TEXT NOT NULL DEFAULT 'v1.0',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'self',
    "is_self" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_member_id" UUID NOT NULL,
    "brand_name" TEXT NOT NULL,
    "generic_name" TEXT,
    "expiry_date" DATE NOT NULL,
    "quantity" INTEGER,
    "dosage_schedule" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deactivated_at" TIMESTAMPTZ,
    "deactivation_reason" TEXT,
    "added_via" TEXT NOT NULL DEFAULT 'manual',
    "resolution_status" TEXT NOT NULL DEFAULT 'pending',
    "resolution_error" TEXT,
    "resolution_attempt_count" INTEGER NOT NULL DEFAULT 0,
    "resolution_attempted_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "medicines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicine_id" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "salt_name" VARCHAR(255) NOT NULL,
    "rxcui" TEXT,
    "resolution_status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rxcui_a" TEXT NOT NULL,
    "rxcui_b" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "severity_ordinal" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'rxnav',
    "cached_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checked_pairs" (
    "rxcui_a" TEXT NOT NULL,
    "rxcui_b" TEXT NOT NULL,
    "has_interactions" BOOLEAN NOT NULL,
    "checked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "needs_recheck" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "checked_pairs_pkey" PRIMARY KEY ("rxcui_a","rxcui_b")
);

-- CreateTable
CREATE TABLE "notification_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "medicine_id" UUID NOT NULL,
    "notification_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicine_scan_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "medicine_id" UUID NOT NULL,
    "raw_ocr_text" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "parsed_brand_name" TEXT,
    "parsed_expiry" TEXT,
    "user_edited_name" BOOLEAN NOT NULL DEFAULT false,
    "user_edited_expiry" BOOLEAN NOT NULL DEFAULT false,
    "saved_brand_name" TEXT,
    "saved_expiry_date" DATE,
    "tesseract_version" TEXT,
    "scanned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_scan_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "medicine_ingredients_medicine_id_idx" ON "medicine_ingredients"("medicine_id");

-- CreateIndex
CREATE INDEX "medicine_ingredients_rxcui_idx" ON "medicine_ingredients"("rxcui");

-- CreateIndex
CREATE INDEX "interactions_cache_rxcui_a_rxcui_b_idx" ON "interactions_cache"("rxcui_a", "rxcui_b");

-- CreateIndex
CREATE UNIQUE INDEX "medicine_scan_log_medicine_id_key" ON "medicine_scan_log"("medicine_id");

-- AddForeignKey
ALTER TABLE "family_members" ADD CONSTRAINT "family_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_family_member_id_fkey" FOREIGN KEY ("family_member_id") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_ingredients" ADD CONSTRAINT "medicine_ingredients_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicine_scan_log" ADD CONSTRAINT "medicine_scan_log_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "medicines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
