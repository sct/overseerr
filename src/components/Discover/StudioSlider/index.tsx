import CompanyCard from '@app/components/CompanyCard';
import Slider from '@app/components/Slider';
import TheMovieDb from '@server/api/themoviedb';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  studios: 'Studios',
});

interface Studio {
  id: number;
  name: string;
  image: string;
  url: string;
}

// Default studio IDs
const defaultStudioIds: number[] = [
  2, 127928, 34, 174, 33, 4, 3, 521, 420, 9993, 41077,
];

// Read additional studio IDs from environment variable (set in docker-compose)
// Example: NEXT_PUBLIC_STUDIO_IDS=123,456,789
const additionalStudioIds = process.env.NEXT_PUBLIC_STUDIO_IDS
  ? process.env.NEXT_PUBLIC_STUDIO_IDS.split(',')
      .map((id) => Number(id.trim()))
      .filter(Boolean)
  : [];

const filteredAdditionalStudioIds = additionalStudioIds.filter(
  (id) => !defaultStudioIds.includes(id)
);

const StudioSlider = () => {
  const intl = useIntl();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [additionalStudios, setAdditionalStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAdditional, setLoadingAdditional] = useState(true);

  const tmdb = new TheMovieDb();

  useEffect(() => {
    const fetchStudios = async () => {
      setLoading(true);
      const results: Studio[] = await Promise.all(
        defaultStudioIds.map(async (id) => {
          const studio = await tmdb.getStudio(Number(id));
          return {
            id: id,
            name: studio.name,
            image: studio.logo_path
              ? `https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)${studio.logo_path}`
              : '',
            url: `/discover/movies/studio/${id}`,
          };
        })
      );
      setStudios(results);
      setLoading(false);
    };

    const fetchAdditionalStudios = async () => {
      setLoadingAdditional(true);
      const results: Studio[] = await Promise.all(
        filteredAdditionalStudioIds.map(async (id) => {
          const studio = await tmdb.getStudio(Number(id));
          return {
            id: id,
            name: studio.name,
            image: studio.logo_path
              ? `https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)${studio.logo_path}`
              : '',
            url: `/discover/movies/studio/${id}`,
          };
        })
      );
      setAdditionalStudios(results);
      setLoadingAdditional(false);
    };

    fetchStudios();
    if (filteredAdditionalStudioIds.length > 0) {
      fetchAdditionalStudios();
    } else {
      setLoadingAdditional(false);
    }
  }, []);

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.studios)}</span>
        </div>
      </div>
      <Slider
        sliderKey="studios"
        isLoading={loading}
        isEmpty={!loading && studios.length === 0}
        items={studios.map((studio) => (
          <CompanyCard
            key={`studio-${studio.id}`}
            name={studio.name}
            image={studio.image}
            url={studio.url}
          />
        ))}
        emptyMessage=""
      />
      {filteredAdditionalStudioIds.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>
                {intl.formatMessage({ defaultMessage: 'Additional Studios' })}
              </span>
            </div>
          </div>
          <Slider
            sliderKey="additional-studios"
            isLoading={loadingAdditional}
            isEmpty={!loadingAdditional && additionalStudios.length === 0}
            items={additionalStudios.map((studio) => (
              <CompanyCard
                key={`additional-studio-${studio.id}`}
                name={studio.name}
                image={studio.image}
                url={studio.url}
              />
            ))}
            emptyMessage=""
          />
        </>
      )}
    </>
  );
};

export default StudioSlider;
