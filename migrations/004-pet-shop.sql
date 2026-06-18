ALTER TABLE pets
ADD COLUMN IF NOT EXISTS owned_species JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE pets
SET owned_species = '[]'::jsonb
WHERE owned_species IS NULL;
