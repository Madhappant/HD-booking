import { useState, useEffect } from 'react';
import { Experience } from '../types';
import { api } from '../lib/api';
import { formatPrice } from '../lib/utils';
import { Loader2 } from 'lucide-react';
import { Header } from '../components/Header';

interface HomePageProps {
  onSelectExperience: (id: string) => void;
}

export function HomePage({ onSelectExperience }: HomePageProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadExperiences();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = experiences.filter(exp =>
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExperiences(filtered);
    } else {
      setFilteredExperiences(experiences);
    }
  }, [searchTerm, experiences]);

  const loadExperiences = async () => {
    try {
      setLoading(true);
      const data = await api.getExperiences();
      setExperiences(data);
      setFilteredExperiences(data);
    } catch (err) {
      setError('Failed to load experiences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-yellow animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading experiences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-main">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadExperiences}
            className="px-6 py-2 bg-primary-yellow text-text-primary rounded-lg hover:bg-primary-yellow-dark transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-main">
      <Header showSearch searchValue={searchTerm} onSearchChange={setSearchTerm} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredExperiences.map((experience) => (
            <div
              key={experience.id}
              className="bg-background-white rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelectExperience(experience.id)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={experience.image_url}
                  alt={experience.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-text-primary flex-1">
                    {experience.title}
                  </h3>
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-text-secondary text-xs rounded whitespace-nowrap">
                    {experience.location.split(',')[0]}
                  </span>
                </div>

                <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                  {experience.short_description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-text-light">From </span>
                    <span className="text-base font-semibold text-text-primary">
                      {formatPrice(experience.price)}
                    </span>
                  </div>
                  <button
                    className="px-4 py-2 bg-primary-yellow hover:bg-primary-yellow-dark text-text-primary text-sm font-medium rounded-lg transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectExperience(experience.id);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
