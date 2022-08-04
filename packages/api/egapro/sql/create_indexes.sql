CREATE INDEX IF NOT EXISTS idx_effectifs ON declaration ((data->'entreprise'->'effectifs'->'tranche'));
CREATE INDEX IF NOT EXISTS idx_status ON declaration (declared_at) WHERE declared_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ft ON search USING GIN (ft);
CREATE INDEX IF NOT EXISTS idx_region ON search(region);
CREATE INDEX IF NOT EXISTS idx_departement ON search(departement);
CREATE INDEX IF NOT EXISTS idx_naf ON search(section_naf);
CREATE INDEX IF NOT EXISTS idx_declared_at ON search (declared_at);
