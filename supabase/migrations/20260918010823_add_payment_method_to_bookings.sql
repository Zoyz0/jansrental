/*
# Add payment_method column to bookings

1. Modified Tables
- `bookings`
  - Added `payment_method` column (text, not null, default 'qris')
    Values: 'qris' (QRIS payment) or 'cash' (pay at store)
  - Added CHECK constraint to ensure only valid payment methods
  - Existing rows default to 'qris' to preserve backward compatibility

2. Notes
- This allows customers to choose between QRIS (online) and Cash (pay at store)
- Cash bookings are created with status 'pending' and marked paid by admin
- No security changes needed — existing RLS policies already cover the new column
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'qris'
  CHECK (payment_method IN ('qris', 'cash'));
