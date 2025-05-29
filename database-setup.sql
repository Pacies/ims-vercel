-- Complete database setup for 2K Inventory System
-- This script will create all tables and disable RLS completely for development

-- First, drop all existing tables to start fresh (be careful in production!)
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS auth_user_mapping CASCADE;
DROP TABLE IF EXISTS raw_materials CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS get_user_type(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_admin_user(UUID) CASCADE;
DROP FUNCTION IF EXISTS is_staff_or_admin(UUID) CASCADE;

-- Create users table
CREATE TABLE users (
    id bigint primary key generated always as identity,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    user_type text NOT NULL DEFAULT 'staff' CHECK (user_type IN ('admin', 'staff', 'viewer')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create inventory_items table
CREATE TABLE inventory_items (
    id bigint primary key generated always as identity,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    price decimal(10,2) NOT NULL DEFAULT 0,
    stock integer NOT NULL DEFAULT 0,
    sku text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock')),
    image_url text,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
    id bigint primary key generated always as identity,
    order_number text UNIQUE NOT NULL,
    customer_name text NOT NULL,
    customer_email text,
    items text NOT NULL,
    total decimal(10,2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create raw_materials table (with category column)
CREATE TABLE raw_materials (
    id bigint primary key generated always as identity,
    name text NOT NULL,
    description text,
    category text, -- Added category column
    quantity decimal(10,2) NOT NULL DEFAULT 0,
    unit text NOT NULL DEFAULT 'units',
    cost_per_unit decimal(10,2) NOT NULL DEFAULT 0,
    supplier text,
    reorder_level decimal(10,2) NOT NULL DEFAULT 0,
    sku text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'out-of-stock')),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create activities table
CREATE TABLE activities (
    id bigint primary key generated always as identity,
    user_id bigint REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT NOW()
);

-- Create auth mapping table
CREATE TABLE auth_user_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    app_user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT NOW(),
    UNIQUE(auth_user_id),
    UNIQUE(app_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
CREATE INDEX IF NOT EXISTS idx_raw_materials_status ON raw_materials(status);
CREATE INDEX IF NOT EXISTS idx_raw_materials_sku ON raw_materials(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_mapping_auth_user_id ON auth_user_mapping(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_user_mapping_app_user_id ON auth_user_mapping(app_user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- COMPLETELY DISABLE ROW LEVEL SECURITY FOR ALL TABLES
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_user_mapping DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure clean slate
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Insert sample data
INSERT INTO users (username, email, user_type, status) VALUES
('admin', 'admin@2kinventory.com', 'admin', 'active'),
('staff', 'staff@2kinventory.com', 'staff', 'active'),
('viewer', 'viewer@2kinventory.com', 'viewer', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO inventory_items (name, description, category, price, stock, sku, status) VALUES
('Wireless Headphones', 'Premium noise-canceling headphones', 'top', 299.99, 45, 'PRD-0001', 'in-stock'),
('Gaming Monitor', '27" 4K gaming monitor with HDR', 'top', 599.99, 23, 'PRD-0002', 'in-stock'),
('Mechanical Keyboard', 'RGB mechanical gaming keyboard', 'bottom', 149.99, 32, 'PRD-0003', 'in-stock'),
('Wireless Mouse', 'Ergonomic wireless gaming mouse', 'bottom', 79.99, 8, 'PRD-0004', 'low-stock'),
('USB Microphone', 'Professional USB condenser microphone', 'top', 199.99, 18, 'PRD-0005', 'in-stock'),
('Smartphone Case', 'Protective case with wireless charging', 'bottom', 49.99, 5, 'PRD-0006', 'low-stock')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (order_number, customer_name, customer_email, items, total, status) VALUES
('ORD-001', 'John Doe', 'john@example.com', 'Wireless Headphones x1', 299.99, 'shipped'),
('ORD-002', 'Jane Smith', 'jane@example.com', 'Gaming Monitor x1', 599.99, 'pending'),
('ORD-003', 'Mike Johnson', 'mike@example.com', 'Mechanical Keyboard x1, Wireless Mouse x1', 229.98, 'processing'),
('ORD-004', 'Sarah Wilson', 'sarah@example.com', 'USB Microphone x1', 199.99, 'delivered'),
('ORD-005', 'David Brown', 'david@example.com', 'Smartphone Case x1', 49.99, 'cancelled')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO raw_materials (name, description, category, quantity, unit, cost_per_unit, supplier, reorder_level, sku, status) VALUES
('Cotton Fabric', 'High-quality cotton fabric for clothing', 'cloth', 500.00, 'yards', 2.50, 'FabricCorp Inc.', 100.00, 'RAW-0001', 'in-stock'),
('Polyester Thread', 'Strong polyester thread for sewing', 'sewing', 200.00, 'spools', 1.50, 'ThreadWorks Ltd.', 50.00, 'RAW-0002', 'in-stock'),
('Buttons', 'Various plastic and metal buttons', 'sewing', 1000.00, 'pieces', 0.25, 'ButtonSupply Co.', 200.00, 'RAW-0003', 'in-stock'),
('Zippers', 'Metal and plastic zippers various sizes', 'sewing', 300.00, 'pieces', 1.75, 'ZipperPro', 75.00, 'RAW-0004', 'in-stock'),
('Denim Fabric', 'Premium denim fabric for jeans', 'cloth', 150.00, 'yards', 4.50, 'DenimCorp', 30.00, 'RAW-0005', 'in-stock')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO activities (action, description) VALUES
('create', 'System initialized with sample data'),
('create', 'Added sample inventory items'),
('create', 'Added sample orders'),
('create', 'Added sample raw materials');

-- Grant all permissions to authenticated users (for development)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon users as well (for development)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Ensure no RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

-- Final confirmation that RLS is disabled
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_user_mapping DISABLE ROW LEVEL SECURITY;
