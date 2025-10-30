import { useState } from 'react';
import { Experience, Slot } from '../types';
import { api } from '../lib/api';
import { formatPrice, formatDate, formatTime, validateEmail } from '../lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';

interface CheckoutPageProps {
  experience: Experience;
  slot: Slot;
  numPeople: number;
  onBack: () => void;
  onSuccess: (bookingReference: string) => void;
  onError: (error: string) => void;
}

export function CheckoutPage({
  experience,
  slot,
  numPeople,
  onBack,
  onSuccess,
  onError,
}: CheckoutPageProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    promo_code: '',
    agreed: false,
  });

  const [errors, setErrors] = useState({
    customer_name: '',
    customer_email: '',
  });

  const [promoStatus, setPromoStatus] = useState<{
    loading: boolean;
    applied: boolean;
    message: string;
    discount: number;
  }>({
    loading: false,
    applied: false,
    message: '',
    discount: 0,
  });

  const [submitting, setSubmitting] = useState(false);

  const basePrice = experience.price * numPeople * slot.price_multiplier;
  const taxes = Math.round(basePrice * 0.059);
  const subtotal = basePrice - promoStatus.discount;
  const finalPrice = subtotal + taxes;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
    if (typeof value === 'string') {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      customer_name: '',
      customer_email: '',
    };

    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Name is required';
    }

    if (!formData.customer_email.trim()) {
      newErrors.customer_email = 'Email is required';
    } else if (!validateEmail(formData.customer_email)) {
      newErrors.customer_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleApplyPromo = async () => {
    if (!formData.promo_code.trim()) return;

    setPromoStatus({ loading: true, applied: false, message: '', discount: 0 });

    try {
      const result = await api.validatePromoCode(formData.promo_code, basePrice);

      if (result.valid) {
        setPromoStatus({
          loading: false,
          applied: true,
          message: result.message,
          discount: result.discount_amount || 0,
        });
      } else {
        setPromoStatus({
          loading: false,
          applied: false,
          message: result.message,
          discount: 0,
        });
      }
    } catch (err) {
      setPromoStatus({
        loading: false,
        applied: false,
        message: 'Failed to validate promo code',
        discount: 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const booking = await api.createBooking({
        experience_id: experience.id,
        slot_id: slot.id,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: '0000000000',
        num_people: numPeople,
        promo_code: promoStatus.applied ? formData.promo_code : undefined,
      });

      onSuccess(booking.booking_reference);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to complete booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-main">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-primary hover:text-text-secondary transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Checkout</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => handleChange('customer_name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-200 border-none rounded-lg text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-yellow"
                    placeholder="Your name"
                  />
                  {errors.customer_name && (
                    <p className="text-sm text-red-600 mt-1">{errors.customer_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customer_email}
                    onChange={(e) => handleChange('customer_email', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-200 border-none rounded-lg text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-yellow"
                    placeholder="Your name"
                  />
                  {errors.customer_email && (
                    <p className="text-sm text-red-600 mt-1">{errors.customer_email}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.promo_code}
                  onChange={(e) => handleChange('promo_code', e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 bg-gray-200 border-none rounded-lg text-text-primary placeholder-text-light focus:outline-none focus:ring-2 focus:ring-primary-yellow"
                  placeholder="Promo code"
                  disabled={promoStatus.applied}
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoStatus.loading || promoStatus.applied || !formData.promo_code}
                  className="px-8 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {promoStatus.loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>

              {promoStatus.message && (
                <p className={`text-sm ${promoStatus.applied ? 'text-green-600' : 'text-red-600'}`}>
                  {promoStatus.message}
                </p>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="agreed"
                  checked={formData.agreed}
                  onChange={(e) => handleChange('agreed', e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-yellow focus:ring-primary-yellow"
                />
                <label htmlFor="agreed" className="text-sm text-text-secondary">
                  I agree to the terms and safety policy
                </label>
              </div>
            </form>
          </div>

          <div className="bg-background-white rounded-xl p-6 h-fit">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Experience</span>
                <span className="text-text-primary font-medium">{experience.title}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Date</span>
                <span className="text-text-primary font-medium">{formatDate(slot.date)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Time</span>
                <span className="text-text-primary font-medium">{formatTime(slot.time)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Qty</span>
                <span className="text-text-primary font-medium">{numPeople}</span>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary font-medium">{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Taxes</span>
                  <span className="text-text-primary font-medium">₹{taxes}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary">{formatPrice(finalPrice)}</span>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.agreed}
                  className="w-full bg-primary-yellow hover:bg-primary-yellow-dark text-text-primary py-3 rounded-lg font-semibold transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay and Confirm'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
