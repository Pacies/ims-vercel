-- Create the database tables for 2K Inventory

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
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
CREATE TABLE IF NOT EXISTS orders (
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

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id bigint primary key generated always as identity,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    user_type text NOT NULL DEFAULT 'staff' CHECK (user_type IN ('admin', 'staff')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
    id bigint primary key generated always as identity,
    name text NOT NULL,
    description text,
    quantity decimal(10,2) NOT NULL DEFAULT 0,
    unit text NOT NULL DEFAULT 'units',
    cost_per_unit decimal(10,2) NOT NULL DEFAULT 0,
    supplier text,
    reorder_level decimal(10,2) NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id bigint primary key generated always as identity,
    user_id bigint REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

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
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (username, email, user_type, status) VALUES
('admin', 'admin@2kinventory.com', 'admin', 'active'),
('staff', 'staff@2kinventory.com', 'staff', 'active')
ON CONFLICT (username) DO NOTHING;

INSERT INTO inventory_items (name, description, category, price, stock, sku, status) VALUES
('Wireless Headphones', 'Premium noise-canceling headphones', 'Electronics', 299.99, 45, 'ELE-0001', 'in-stock'),
('Gaming Monitor', '27" 4K gaming monitor with HDR', 'Electronics', 599.99, 23, 'ELE-0002', 'in-stock'),
('Mechanical Keyboard', 'RGB mechanical gaming keyboard', 'Electronics', 149.99, 32, 'ELE-0003', 'in-stock'),
('Wireless Mouse', 'Ergonomic wireless gaming mouse', 'Electronics', 79.99, 8, 'ELE-0004', 'low-stock'),
('USB Microphone', 'Professional USB condenser microphone', 'Electronics', 199.99, 18, 'ELE-0005', 'in-stock'),
('Smartphone Case', 'Protective case with wireless charging', 'Accessories', 49.99, 5, 'ACC-0001', 'low-stock')
ON CONFLICT (sku) DO NOTHING;

INSERT INTO orders (order_number, customer_name, customer_email, items, total, status) VALUES
('ORD-001', 'John Doe', 'john@example.com', 'Wireless Headphones x1', 299.99, 'shipped'),
('ORD-002', 'Jane Smith', 'jane@example.com', 'Gaming Monitor x1', 599.99, 'pending'),
('ORD-003', 'Mike Johnson', 'mike@example.com', 'Mechanical Keyboard x1, Wireless Mouse x1', 229.98, 'processing'),
('ORD-004', 'Sarah Wilson', 'sarah@example.com', 'USB Microphone x1', 199.99, 'delivered'),
('ORD-005', 'David Brown', 'david@example.com', 'Smartphone Case x1', 49.99, 'cancelled')
ON CONFLICT (order_number) DO NOTHING;

INSERT INTO raw_materials (name, description, quantity, unit, cost_per_unit, supplier, reorder_level) VALUES
('Plastic Pellets', 'High-grade plastic pellets for manufacturing', 500.00, 'kg', 2.50, 'PlasticCorp Inc.', 100.00),
('Steel Sheets', 'Stainless steel sheets for product frames', 200.00, 'sheets', 15.00, 'SteelWorks Ltd.', 50.00),
('Electronic Components', 'Various electronic components and circuits', 1000.00, 'units', 0.75, 'ElectroSupply Co.', 200.00),
('Packaging Materials', 'Cardboard boxes and protective packaging', 800.00, 'units', 1.25, 'PackagePro', 150.00)
ON CONFLICT DO NOTHING;

INSERT INTO activities (action, description) VALUES
('create', 'System initialized with sample data'),
('create', 'Added sample inventory items'),
('create', 'Added sample orders'),
('create', 'Added sample raw materials');

-- Enable Row Level Security (RLS)
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - customize based on your needs)
CREATE POLICY "Allow all operations on inventory_items" ON inventory_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on raw_materials" ON raw_materials FOR ALL USING (true);
CREATE POLICY "Allow all operations on activities" ON activities FOR ALL USING (true);

-- Note: You will need to create RLS policies before being able to read or write to the tables over Supabase APIs.