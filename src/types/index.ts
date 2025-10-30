export interface Experience {
  id: string;
  title: string;
  description: string;
  short_description: string;
  location: string;
  price: number;
  image_url: string;
  duration: string;
  category: string;
  rating: number;
  total_reviews: number;
  capacity: number;
  is_active: boolean;
  created_at: string;
  slots?: Slot[];
}

export interface Slot {
  id: string;
  experience_id: string;
  date: string;
  time: string;
  available_capacity: number;
  total_capacity: number;
  price_multiplier: number;
  is_available: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  experience_id: string;
  slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  num_people: number;
  total_price: number;
  promo_code?: string;
  discount_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  booking_reference: string;
  created_at: string;
}

export interface PromoCode {
  valid: boolean;
  message: string;
  discount_type?: 'percentage' | 'flat';
  discount_value?: number;
  discount_amount?: number;
}

export interface BookingFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  num_people: number;
  promo_code: string;
}
