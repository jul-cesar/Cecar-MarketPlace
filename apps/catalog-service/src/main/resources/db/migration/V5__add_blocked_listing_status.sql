ALTER TABLE listing
    DROP CONSTRAINT IF EXISTS chk_listing_status;

ALTER TABLE listing
    ADD CONSTRAINT chk_listing_status CHECK (status IN ('ACTIVE', 'SOLD', 'PAUSED', 'REMOVED', 'BLOCKED'));
