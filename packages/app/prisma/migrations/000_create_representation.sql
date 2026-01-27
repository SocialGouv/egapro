-- CreateTable
CREATE TABLE "archive" (
    "siren" TEXT,
    "year" INTEGER,
    "at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "by" TEXT,
    "ip" INET,
    "data" JSONB
);

-- CreateTable
CREATE TABLE "representation_equilibree" (
    "siren" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "modified_at" TIMESTAMPTZ(6),
    "declared_at" TIMESTAMPTZ(6),
    "data" JSONB,
    "ft" tsvector,

    CONSTRAINT "representation_equilibree_pkey" PRIMARY KEY ("siren","year")
);

-- CreateTable
CREATE TABLE "search_representation_equilibree" (
    "siren" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "declared_at" TIMESTAMPTZ(6),
    "ft" tsvector,
    "region" VARCHAR(2),
    "departement" VARCHAR(3),
    "section_naf" CHAR(1),

    CONSTRAINT "search_representation_equilibree_pkey" PRIMARY KEY ("siren","year")
);

-- CreateIndex
CREATE INDEX "idx_representation_equilibree_year" ON "representation_equilibree"("year");

-- CreateIndex
CREATE INDEX "idx_siren" ON "representation_equilibree"("siren");

-- CreateIndex
CREATE INDEX "idx_representation_equilibree_declared_at" ON "search_representation_equilibree"("declared_at");

-- CreateIndex
CREATE INDEX "idx_representation_equilibree_departement" ON "search_representation_equilibree"("departement");

-- CreateIndex
CREATE INDEX "idx_representation_equilibree_ft" ON "search_representation_equilibree" USING GIN ("ft");

-- CreateIndex
CREATE INDEX "idx_representation_equilibree_naf" ON "search_representation_equilibree"("section_naf");

-- CreateIndex
CREATE INDEX "idx_representation_equilibree_region" ON "search_representation_equilibree"("region");

-- CreateIndex
CREATE INDEX "idx_search_representation_equilibree_siren" ON "search_representation_equilibree"("siren");

-- CreateIndex
CREATE INDEX "idx_search_representation_equilibree_year" ON "search_representation_equilibree"("year");

-- AddForeignKey
ALTER TABLE "search_representation_equilibree" ADD CONSTRAINT "representation_equilibree_exists" FOREIGN KEY ("siren", "year") REFERENCES "representation_equilibree"("siren", "year") ON DELETE CASCADE ON UPDATE CASCADE;

