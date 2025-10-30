import { Check } from 'lucide-react';
import { Header } from '../components/Header';

interface ResultPageProps {
  success: boolean;
  bookingReference?: string;
  errorMessage?: string;
  onGoHome: () => void;
}

export function ResultPage({ success, bookingReference, errorMessage, onGoHome }: ResultPageProps) {
  return (
    <div className="min-h-screen bg-background-main">
      <Header />

      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {success ? (
            <>
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white stroke-[3]" />
              </div>

              <h1 className="text-3xl font-bold text-text-primary mb-3">Booking Confirmed</h1>

              {bookingReference && (
                <p className="text-text-secondary mb-8">
                  Ref ID: {bookingReference}
                </p>
              )}

              <button
                onClick={onGoHome}
                className="px-8 py-3 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Back to Home
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-white stroke-[3]" />
              </div>

              <h1 className="text-3xl font-bold text-text-primary mb-3">Booking Failed</h1>

              <p className="text-text-secondary mb-8">
                {errorMessage || 'Unfortunately, we could not complete your booking. Please try again.'}
              </p>

              <button
                onClick={onGoHome}
                className="px-8 py-3 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
