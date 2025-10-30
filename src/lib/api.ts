import { Experience, Booking, PromoCode } from '../types';

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

const getHeaders = () => ({
  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
});

export const api = {
  async getExperiences(): Promise<Experience[]> {
    const response = await fetch(`${API_BASE}/get-experiences`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch experiences');
    return response.json();
  },

  async getExperienceById(id: string): Promise<Experience> {
    const response = await fetch(`${API_BASE}/get-experiences?id=${id}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch experience');
    return response.json();
  },

  async createBooking(bookingData: {
    experience_id: string;
    slot_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    num_people: number;
    promo_code?: string;
  }): Promise<Booking> {
    const response = await fetch(`${API_BASE}/create-booking`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create booking');
    }
    return response.json();
  },

  async validatePromoCode(code: string, amount: number): Promise<PromoCode> {
    const response = await fetch(`${API_BASE}/validate-promo`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, amount }),
    });
    if (!response.ok) throw new Error('Failed to validate promo code');
    return response.json();
  },
};
