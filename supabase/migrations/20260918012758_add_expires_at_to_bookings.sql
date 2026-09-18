/*
# Add expires_at column to bookings

1. Modified Tables
- `bookings`
  - Added `expires_at` column (timestamptz, nullable)
    - Set by checkout API routes when a booking is created
    - QRIS bookings: expires_at = BuatQris expiry (typically 15 min)
    - Cash bookings: expires_at = created_at + 2 hours
    - Admin can see how long until a pending booking expires
    - Pending bookings past expires_at should be treated as expired

2. Notes
- No security changes — existing RLS policies already cover the new column
- Column is nullable so existing rows are not affected
*/

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;
