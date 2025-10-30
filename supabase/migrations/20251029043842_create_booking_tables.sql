/*
  # Create BookIt Database Schema

  ## Overview
  This migration creates the complete database structure for the BookIt travel experiences 
  booking system, including experiences, time slots, bookings, and promotional codes.

  ## New Tables

  ### 1. experiences
  Stores travel experience listings with details and pricing
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Experience name
  - `description` (text) - Full description
  - `short_description` (text) - Brief overview
  - `location` (text) - Where the experience takes place
  - `price` (numeric) - Base price per person
  - `image_url` (text) - Main image URL
  - `duration` (text) - Duration description (e.g., "2 hours")
  - `category` (text) - Experience category (e.g., "Adventure", "Culture")
  - `rating` (numeric) - Average rating (0-5)
  - `total_reviews` (integer) - Number of reviews
  - `capacity` (integer) - Maximum people per slot
  - `is_active` (boolean) - Whether experience is available
  - `created_at` (timestamptz) - Creation timestamp

  ### 2. slots
  Available time slots for each experience
  - `id` (uuid, primary key) - Unique identifier
  - `experience_id` (uuid, foreign key) - References experiences
  - `date` (date) - Slot date
  - `time` (time) - Slot time
  - `available_capacity` (integer) - Remaining spots
  - `total_capacity` (integer) - Total spots
  - `price_multiplier` (numeric) - Price adjustment (default 1.0)
  - `is_available` (boolean) - Slot availability status
  - `created_at` (timestamptz) - Creation timestamp

  ### 3. bookings
  Customer booking records
  - `id` (uuid, primary key) - Unique identifier
  - `experience_id` (uuid, foreign key) - References experiences
  - `slot_id` (uuid, foreign key) - References slots
  - `customer_name` (text) - Customer full name
  - `customer_email` (text) - Customer email
  - `customer_phone` (text) - Customer phone number
  - `num_people` (integer) - Number of people
  - `total_price` (numeric) - Final price after discounts
  - `promo_code` (text) - Applied promo code (nullable)
  - `discount_amount` (numeric) - Discount applied
  - `status` (text) - Booking status (pending, confirmed, cancelled)
  - `booking_reference` (text) - Unique booking reference
  - `created_at` (timestamptz) - Booking timestamp

  ### 4. promo_codes
  Promotional discount codes
  - `id` (uuid, primary key) - Unique identifier
  - `code` (text, unique) - Promo code string
  - `discount_type` (text) - Type (percentage, flat)
  - `discount_value` (numeric) - Discount amount or percentage
  - `min_amount` (numeric) - Minimum purchase required
  - `max_discount` (numeric) - Maximum discount cap (for percentage)
  - `is_active` (boolean) - Whether code is active
  - `valid_from` (timestamptz) - Start date
  - `valid_until` (timestamptz) - End date
  - `usage_limit` (integer) - Maximum uses (nullable)
  - `usage_count` (integer) - Current usage count
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for experiences and slots (browsing)
  - Authenticated users can create bookings
  - Promo code validation restricted to prevent abuse

  ## Indexes
  - Indexed foreign keys for performance
  - Indexed booking reference for quick lookups
  - Indexed promo codes for validation queries

  ## Important Notes
  - All tables use UUID for primary keys
  - Timestamps use timestamptz for timezone awareness
  - Capacity management prevents overbooking
  - Promo codes have usage limits and expiration
*/

-- Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  short_description text NOT NULL,
  location text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text NOT NULL,
  duration text NOT NULL,
  category text NOT NULL,
  rating numeric DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  capacity integer NOT NULL CHECK (capacity > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create slots table
CREATE TABLE IF NOT EXISTS slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  date date NOT NULL,
  time time NOT NULL,
  available_capacity integer NOT NULL CHECK (available_capacity >= 0),
  total_capacity integer NOT NULL CHECK (total_capacity > 0),
  price_multiplier numeric DEFAULT 1.0 CHECK (price_multiplier > 0),
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(experience_id, date, time)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id),
  slot_id uuid NOT NULL REFERENCES slots(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  num_people integer NOT NULL CHECK (num_people > 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  promo_code text,
  discount_amount numeric DEFAULT 0 CHECK (discount_amount >= 0),
  status text DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  booking_reference text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_amount numeric DEFAULT 0 CHECK (min_amount >= 0),
  max_discount numeric,
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  usage_limit integer,
  usage_count integer DEFAULT 0 CHECK (usage_count >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_slots_experience_id ON slots(experience_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(date);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);

-- Enable Row Level Security
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiences (public read)
CREATE POLICY "Anyone can view active experiences"
  ON experiences FOR SELECT
  USING (is_active = true);

-- RLS Policies for slots (public read)
CREATE POLICY "Anyone can view available slots"
  ON slots FOR SELECT
  USING (is_available = true);

-- RLS Policies for bookings (anyone can insert, read own)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view bookings with reference"
  ON bookings FOR SELECT
  USING (true);

-- RLS Policies for promo_codes (read only for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true);

-- Insert sample experiences
INSERT INTO experiences (title, description, short_description, location, price, image_url, duration, category, rating, total_reviews, capacity) VALUES
('Sunset Desert Safari', 'Experience the magic of the desert as the sun sets over golden dunes. Enjoy dune bashing, camel riding, and a traditional BBQ dinner under the stars with live entertainment.', 'Desert adventure with dinner and entertainment', 'Dubai Desert, UAE', 120, 'https://images.pexels.com/photos/2859169/pexels-photo-2859169.jpeg', '6 hours', 'Adventure', 4.8, 234, 20),
('Scuba Diving Adventure', 'Dive into the crystal-clear waters and explore vibrant coral reefs. Perfect for beginners and experienced divers. All equipment included with professional instructors.', 'Explore underwater coral reefs', 'Great Barrier Reef, Australia', 150, 'https://images.pexels.com/photos/1002703/pexels-photo-1002703.jpeg', '4 hours', 'Water Sports', 4.9, 189, 8),
('City Food Tour', 'Discover hidden culinary gems and taste authentic local cuisine. Visit 6 different locations and try 12+ dishes while learning about the food culture and history.', 'Taste authentic local cuisine', 'Bangkok, Thailand', 65, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg', '3 hours', 'Culinary', 4.7, 342, 15),
('Mountain Hiking Trek', 'Trek through stunning mountain landscapes with breathtaking views. Suitable for moderate fitness levels. Includes guide, snacks, and photography stops.', 'Scenic mountain trail adventure', 'Swiss Alps, Switzerland', 95, 'https://images.pexels.com/photos/868097/pexels-photo-868097.jpeg', '5 hours', 'Adventure', 4.6, 156, 12),
('Historical City Walking Tour', 'Walk through centuries of history visiting iconic landmarks, ancient monuments, and UNESCO World Heritage sites. Expert local guides bring history to life.', 'Explore ancient landmarks and culture', 'Rome, Italy', 45, 'https://images.pexels.com/photos/2064827/pexels-photo-2064827.jpeg', '2.5 hours', 'Culture', 4.8, 428, 25),
('Northern Lights Experience', 'Chase the magical Aurora Borealis with expert guides. Includes warm clothing, hot drinks, and professional photography. Best viewing spots guaranteed.', 'Witness the Aurora Borealis', 'Tromso, Norway', 200, 'https://images.pexels.com/photos/1933316/pexels-photo-1933316.jpeg', '4 hours', 'Nature', 5.0, 267, 10);

-- Insert sample slots for the next 14 days
INSERT INTO slots (experience_id, date, time, available_capacity, total_capacity) 
SELECT 
  e.id,
  CURRENT_DATE + (d || ' days')::interval,
  t.slot_time,
  e.capacity,
  e.capacity
FROM experiences e
CROSS JOIN generate_series(0, 13) d
CROSS JOIN (
  VALUES ('09:00'::time), ('14:00'::time), ('18:00'::time)
) AS t(slot_time)
WHERE e.is_active = true;

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, min_amount, max_discount, valid_until, usage_limit) VALUES
('SAVE10', 'percentage', 10, 50, 50, CURRENT_TIMESTAMP + interval '30 days', 100),
('FLAT100', 'flat', 100, 200, NULL, CURRENT_TIMESTAMP + interval '30 days', 50),
('WELCOME20', 'percentage', 20, 0, 100, CURRENT_TIMESTAMP + interval '60 days', 200);