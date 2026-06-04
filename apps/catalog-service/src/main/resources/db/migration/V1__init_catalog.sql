CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE category (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2),
    listing_type VARCHAR(20) NOT NULL,
    condition VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    location VARCHAR(255),
    contact_info JSONB,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_listing_type CHECK (listing_type IN ('SALE', 'EXCHANGE', 'DONATION')),
    CONSTRAINT chk_listing_condition CHECK (condition IS NULL OR condition IN ('NEW', 'LIKE_NEW', 'USED', 'FAIR')),
    CONSTRAINT chk_listing_status CHECK (status IN ('ACTIVE', 'SOLD', 'PAUSED', 'REMOVED')),
    CONSTRAINT chk_listing_price_non_negative CHECK (price IS NULL OR price >= 0)
);

CREATE TABLE listing_category (
    listing_id UUID NOT NULL,
    category_id UUID NOT NULL,
    PRIMARY KEY (listing_id, category_id),
    CONSTRAINT fk_listing_category_listing FOREIGN KEY (listing_id) REFERENCES listing(id) ON DELETE CASCADE,
    CONSTRAINT fk_listing_category_category FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE RESTRICT
);

CREATE TABLE listing_image (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_listing_image_listing FOREIGN KEY (listing_id) REFERENCES listing(id) ON DELETE CASCADE,
    CONSTRAINT chk_listing_image_sort_order CHECK (sort_order >= 0)
);

CREATE INDEX idx_listing_seller_id ON listing(seller_id);
CREATE INDEX idx_listing_status ON listing(status);
CREATE INDEX idx_listing_type ON listing(listing_type);
CREATE INDEX idx_listing_created_at ON listing(created_at DESC);
CREATE INDEX idx_listing_category_category_id ON listing_category(category_id);
CREATE INDEX idx_listing_image_listing_id ON listing_image(listing_id);

INSERT INTO category (name, slug, icon) VALUES
    ('Electrónica', 'electronica', 'laptop'),
    ('Libros', 'libros', 'book'),
    ('Ropa', 'ropa', 'shirt'),
    ('Servicios Tutoría', 'servicios-tutoria', 'graduation-cap'),
    ('Hogar', 'hogar', 'home'),
    ('Deportes', 'deportes', 'dumbbell'),
    ('Vehículos', 'vehiculos', 'car'),
    ('Otros', 'otros', 'package');
