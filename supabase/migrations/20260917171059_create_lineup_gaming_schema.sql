/*
# Line Up Gaming Space — Initial Schema

1. New Tables
- `consoles` — rental consoles for in-store booking (PS3, PS4, PS5, VIP). Columns: id, name, price_per_hour (int), description, icon, is_active, created_at.
- `food_items` — food & drinks available for order. Columns: id, name, price (int), stock (int), category, emoji, is_active, created_at.
- `daily_rentals` — console units available for daily rental. Columns: id, name, category (console/box), price_per_day (int), available_units (int), description, emoji, is_active, created_at.
- `bookings` — in-store booking records. Columns: id, console_id (FK), console_name, duration_hours (int), food_items_json (jsonb), total_amount (int), status (text: pending/paid/expired/failed), buatqris_transaction_id (text), customer_name (text), customer_phone (text), created_at, paid_at.
- `daily_rental_bookings` — daily rental booking records. Columns: id, rental_id (FK), rental_name, customer_name (text), customer_phone (text), start_date (date), end_date (date), total_days (int), total_amount (int), status (text), created_at.
- `processed_webhooks` — idempotency table for BuatQris webhooks. Columns: id, transaction_id (text unique), payload_hash (text), processed_at (timestamptz).

2. Security
- This is a single-tenant app with no sign-in screen — all policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)` because the data is intentionally public/shared (product catalog, booking creation).
- RLS enabled on all tables.
*/

-- Consoles for in-store rental
CREATE TABLE IF NOT EXISTS consoles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_per_hour integer NOT NULL,
  description text,
  icon text DEFAULT 'Gamepad2',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Food & drinks
CREATE TABLE IF NOT EXISTS food_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price integer NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  category text DEFAULT 'food',
  emoji text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Daily rental items (consoles and boxes)
CREATE TABLE IF NOT EXISTS daily_rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('console', 'box')),
  price_per_day integer NOT NULL,
  available_units integer NOT NULL DEFAULT 1,
  description text,
  emoji text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- In-store bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  console_id uuid REFERENCES consoles(id) ON DELETE SET NULL,
  console_name text NOT NULL,
  duration_hours integer NOT NULL,
  food_items_json jsonb DEFAULT '[]'::jsonb,
  total_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'failed')),
  buatqris_transaction_id text,
  customer_name text,
  customer_phone text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Daily rental bookings
CREATE TABLE IF NOT EXISTS daily_rental_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_id uuid REFERENCES daily_rentals(id) ON DELETE SET NULL,
  rental_name text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_days integer NOT NULL,
  total_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Webhook idempotency
CREATE TABLE IF NOT EXISTS processed_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id text UNIQUE NOT NULL,
  payload_hash text,
  processed_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE consoles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;

-- Consoles: public read, public write (single-tenant)
DROP POLICY IF EXISTS "anon_select_consoles" ON consoles;
CREATE POLICY "anon_select_consoles" ON consoles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_consoles" ON consoles;
CREATE POLICY "anon_insert_consoles" ON consoles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_consoles" ON consoles;
CREATE POLICY "anon_update_consoles" ON consoles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_consoles" ON consoles;
CREATE POLICY "anon_delete_consoles" ON consoles FOR DELETE
  TO anon, authenticated USING (true);

-- Food items: public read, public write
DROP POLICY IF EXISTS "anon_select_food_items" ON food_items;
CREATE POLICY "anon_select_food_items" ON food_items FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_food_items" ON food_items;
CREATE POLICY "anon_insert_food_items" ON food_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_food_items" ON food_items;
CREATE POLICY "anon_update_food_items" ON food_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_food_items" ON food_items;
CREATE POLICY "anon_delete_food_items" ON food_items FOR DELETE
  TO anon, authenticated USING (true);

-- Daily rentals: public read, public write
DROP POLICY IF EXISTS "anon_select_daily_rentals" ON daily_rentals;
CREATE POLICY "anon_select_daily_rentals" ON daily_rentals FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_daily_rentals" ON daily_rentals;
CREATE POLICY "anon_insert_daily_rentals" ON daily_rentals FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_daily_rentals" ON daily_rentals;
CREATE POLICY "anon_update_daily_rentals" ON daily_rentals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_daily_rentals" ON daily_rentals;
CREATE POLICY "anon_delete_daily_rentals" ON daily_rentals FOR DELETE
  TO anon, authenticated USING (true);

-- Bookings: public read, public write
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE
  TO anon, authenticated USING (true);

-- Daily rental bookings: public read, public write
DROP POLICY IF EXISTS "anon_select_daily_rental_bookings" ON daily_rental_bookings;
CREATE POLICY "anon_select_daily_rental_bookings" ON daily_rental_bookings FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_daily_rental_bookings" ON daily_rental_bookings;
CREATE POLICY "anon_insert_daily_rental_bookings" ON daily_rental_bookings FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_daily_rental_bookings" ON daily_rental_bookings;
CREATE POLICY "anon_update_daily_rental_bookings" ON daily_rental_bookings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_daily_rental_bookings" ON daily_rental_bookings;
CREATE POLICY "anon_delete_daily_rental_bookings" ON daily_rental_bookings FOR DELETE
  TO anon, authenticated USING (true);

-- Processed webhooks: public read, public write
DROP POLICY IF EXISTS "anon_select_processed_webhooks" ON processed_webhooks;
CREATE POLICY "anon_select_processed_webhooks" ON processed_webhooks FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_processed_webhooks" ON processed_webhooks;
CREATE POLICY "anon_insert_processed_webhooks" ON processed_webhooks FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_processed_webhooks" ON processed_webhooks;
CREATE POLICY "anon_update_processed_webhooks" ON processed_webhooks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_processed_webhooks" ON processed_webhooks;
CREATE POLICY "anon_delete_processed_webhooks" ON processed_webhooks FOR DELETE
  TO anon, authenticated USING (true);

-- Seed data
INSERT INTO consoles (name, price_per_hour, description, icon) VALUES
  ('PS 3', 5000, 'PlayStation 3 — koleksi game klasik', 'Gamepad2'),
  ('PS 4', 10000, 'PlayStation 4 — game terbaru dan populer', 'Gamepad2'),
  ('PS 5', 15000, 'PlayStation 5 — next-gen gaming experience', 'Gamepad2'),
  ('Tempat VIP', 35000, 'Ruang VIP lebih privat — cocok rombongan/keluarga', 'Crown')
ON CONFLICT DO NOTHING;

INSERT INTO food_items (name, price, stock, category, emoji) VALUES
  ('Kentang Goreng', 15000, 3, 'food', '🍟'),
  ('Es Teh', 5000, 6, 'drink', '🧊'),
  ('Kopi', 8000, 8, 'drink', '☕')
ON CONFLICT DO NOTHING;

INSERT INTO daily_rentals (name, category, price_per_day, available_units, description, emoji) VALUES
  ('PS 5 Slim', 'console', 100000, 3, 'Unit konsol PS5 Slim — bawa pulang, tanpa ruang', '🎮'),
  ('PS 4 Pro', 'console', 75000, 3, 'Unit konsol PS4 Pro — bawa pulang, tanpa ruang', '🎮'),
  ('Nintendo Switch OLED', 'console', 80000, 1, 'Nintendo Switch OLED — bawa pulang', '🎮'),
  ('Line Up Box PS 5', 'box', 150000, 1, 'Paket lengkap: PS5 + layar + tempat — bisa di tempat atau bawa pulang', '📦'),
  ('Line Up Box PS 4', 'box', 120000, 2, 'Paket lengkap: PS4 + layar + tempat — bisa di tempat atau bawa pulang', '📦')
ON CONFLICT DO NOTHING;
