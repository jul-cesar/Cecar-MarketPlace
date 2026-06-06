ALTER TABLE listing
    ALTER COLUMN seller_id TYPE VARCHAR(191) USING seller_id::TEXT;

ALTER TABLE listing
    DROP CONSTRAINT IF EXISTS chk_listing_type,
    DROP CONSTRAINT IF EXISTS chk_listing_condition;

ALTER TABLE listing
    ADD CONSTRAINT chk_listing_type CHECK (listing_type IN ('SALE', 'EXCHANGE', 'SERVICE')),
    ADD CONSTRAINT chk_listing_condition CHECK (condition IS NULL OR condition IN ('NEW', 'LIKE_NEW', 'USED'));
