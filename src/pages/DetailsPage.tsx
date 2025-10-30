import { useState, useEffect } from 'react';
import { Experience, Slot } from '../types';
import { api } from '../lib/api';
import { formatPrice, formatTime } from '../lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '../components/Header';

interface DetailsPageProps {
  experienceId: string;
  onBack: () => void;
  onBookSlot: (experience: Experience, slot: Slot, numPeople: number) => void;
}

export function DetailsPage({ experienceId, onBack, onBookSlot }: DetailsPageProps) {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [numPeople, setNumPeople] = useState(1);

  useEffect(() => {
    loadExperience();
  }, [experienceId]);

  const loadExperience = async () => {
    try {
      setLoading(true);
      const data = await api.getExperienceById(experienceId);
      setExperience(data);
      if (data.slots && data.slots.length > 0) {
        const uniqueDates = [...new Set(data.slots.map(s => s.date))];
        setSelectedDate(uniqueDates[0]);
        const firstSlot = data.slots.find(s => s.date === uniqueDates[0]);
        if (firstSlot) {
          setSelectedSlot(firstSlot);
        }
      }
    } catch (err) {
      setError('Failed to load experience details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-yellow animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading experience...</p>
        </div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-primary-yellow text-text-primary rounded-lg hover:bg-primary-yellow-dark transition font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const uniqueDates = experience.slots
    ? [...new Set(experience.slots.map(s => s.date))].slice(0, 10)
    : [];

  const availableSlots = experience.slots
    ? experience.slots.filter(s => s.date === selectedDate && s.available_capacity > 0)
    : [];

  const handleBooking = () => {
    if (selectedSlot && numPeople > 0) {
      onBookSlot(experience, selectedSlot, numPeople);
    }
  };

  return (
    <div className="min-h-screen bg-background-main">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-primary hover:text-text-secondary transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background-white rounded-xl overflow-hidden">
              <img
                src={experience.image_url}
                alt={experience.title}
                className="w-full h-96 object-cover"
              />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-text-primary mb-2">
                      {experience.title}
                    </h1>
                    <p className="text-text-secondary">{experience.location}</p>
                  </div>
                  <span className="ml-4 px-3 py-1 bg-gray-100 text-text-secondary text-sm rounded">
                    {experience.category}
                  </span>
                </div>

                <p className="text-text-secondary leading-relaxed">{experience.description}</p>

                <div className="mt-6 flex items-center gap-6 text-sm text-text-secondary">
                  <div>
                    <span className="font-medium">Duration:</span> {experience.duration}
                  </div>
                  <div>
                    <span className="font-medium">Capacity:</span> Up to {experience.capacity} people
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-background-white rounded-xl p-6 space-y-6 sticky top-8">
              <div>
                <div className="text-sm text-text-secondary mb-1">From</div>
                <div className="text-3xl font-bold text-text-primary">
                  {formatPrice(experience.price)}
                </div>
                <div className="text-sm text-text-light">per person</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Number of People
                </label>
                <select
                  value={numPeople}
                  onChange={(e) => setNumPeople(parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-100 border-none rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-yellow"
                >
                  {[...Array(Math.min(10, experience.capacity))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1} {i === 0 ? 'Person' : 'People'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Select Date
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {uniqueDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        const firstSlotOnDate = experience.slots?.find(s => s.date === date);
                        setSelectedSlot(firstSlotOnDate || null);
                      }}
                      className={`p-2 rounded-lg text-center transition text-xs ${
                        selectedDate === date
                          ? 'bg-primary-yellow text-text-primary font-medium'
                          : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                      }`}
                    >
                      <div className="font-medium">
                        {new Date(date).getDate()}
                      </div>
                      <div className="text-[10px]">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Select Time
                  </label>
                  <div className="space-y-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`w-full p-3 rounded-lg flex items-center justify-between transition ${
                          selectedSlot?.id === slot.id
                            ? 'bg-primary-yellow text-text-primary'
                            : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                        }`}
                      >
                        <span className="font-medium">
                          {formatTime(slot.time)}
                        </span>
                        <span className="text-sm">
                          {slot.available_capacity} left
                        </span>
                      </button>
                    ))}
                    {availableSlots.length === 0 && (
                      <p className="text-sm text-text-secondary text-center py-4">
                        No available slots for this date
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span>Total</span>
                  <span>{formatPrice(experience.price * numPeople)}</span>
                </div>

                <button
                  onClick={handleBooking}
                  disabled={!selectedSlot}
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    selectedSlot
                      ? 'bg-primary-yellow text-text-primary hover:bg-primary-yellow-dark'
                      : 'bg-gray-200 text-text-light cursor-not-allowed'
                  }`}
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
