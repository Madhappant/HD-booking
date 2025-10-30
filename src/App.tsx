import { useState } from 'react';
import { HomePage } from './pages/HomePage';
import { DetailsPage } from './pages/DetailsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { ResultPage } from './pages/ResultPage';
import { Experience, Slot } from './types';

type Page = 'home' | 'details' | 'checkout' | 'result';

interface AppState {
  currentPage: Page;
  selectedExperienceId: string | null;
  selectedExperience: Experience | null;
  selectedSlot: Slot | null;
  numPeople: number;
  bookingReference: string | null;
  errorMessage: string | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentPage: 'home',
    selectedExperienceId: null,
    selectedExperience: null,
    selectedSlot: null,
    numPeople: 1,
    bookingReference: null,
    errorMessage: null,
  });

  const navigateToDetails = (experienceId: string) => {
    setState({
      ...state,
      currentPage: 'details',
      selectedExperienceId: experienceId,
    });
  };

  const navigateToCheckout = (experience: Experience, slot: Slot, numPeople: number) => {
    setState({
      ...state,
      currentPage: 'checkout',
      selectedExperience: experience,
      selectedSlot: slot,
      numPeople,
    });
  };

  const handleBookingSuccess = (bookingReference: string) => {
    setState({
      ...state,
      currentPage: 'result',
      bookingReference,
      errorMessage: null,
    });
  };

  const handleBookingError = (errorMessage: string) => {
    setState({
      ...state,
      currentPage: 'result',
      bookingReference: null,
      errorMessage,
    });
  };

  const navigateToHome = () => {
    setState({
      currentPage: 'home',
      selectedExperienceId: null,
      selectedExperience: null,
      selectedSlot: null,
      numPeople: 1,
      bookingReference: null,
      errorMessage: null,
    });
  };

  const navigateBack = () => {
    if (state.currentPage === 'details') {
      navigateToHome();
    } else if (state.currentPage === 'checkout') {
      setState({ ...state, currentPage: 'details' });
    }
  };

  return (
    <>
      {state.currentPage === 'home' && (
        <HomePage onSelectExperience={navigateToDetails} />
      )}

      {state.currentPage === 'details' && state.selectedExperienceId && (
        <DetailsPage
          experienceId={state.selectedExperienceId}
          onBack={navigateBack}
          onBookSlot={navigateToCheckout}
        />
      )}

      {state.currentPage === 'checkout' && state.selectedExperience && state.selectedSlot && (
        <CheckoutPage
          experience={state.selectedExperience}
          slot={state.selectedSlot}
          numPeople={state.numPeople}
          onBack={navigateBack}
          onSuccess={handleBookingSuccess}
          onError={handleBookingError}
        />
      )}

      {state.currentPage === 'result' && (
        <ResultPage
          success={!!state.bookingReference}
          bookingReference={state.bookingReference || undefined}
          errorMessage={state.errorMessage || undefined}
          onGoHome={navigateToHome}
        />
      )}
    </>
  );
}

export default App;
