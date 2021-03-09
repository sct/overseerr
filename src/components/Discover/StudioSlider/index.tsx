import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import CompanyCard from '../../CompanyCard';
import Slider from '../../Slider';

const messages = defineMessages({
  studios: 'Studios',
});

interface Studio {
  name: string;
  image: string;
  url: string;
}

const studios: Studio[] = [
  {
    name: 'Disney',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/wdrCwmRnLFJhEoH8GSfymY85KHT.png',
    url: '/discover/movies/studio/2',
  },
  {
    name: '20th Century Fox',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/qZCc1lty5FzX30aOCVRBLzaVmcp.png',
    url: '/discover/movies/studio/25',
  },
  {
    name: 'Sony Pictures',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/GagSvqWlyPdkFHMfQ3pNq6ix9P.png',
    url: '/discover/movies/studio/34',
  },
  {
    name: 'Warner Bros. Pictures',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ky0xOc5OrhzkZ1N6KyUxacfQsCk.png',
    url: '/discover/movies/studio/174',
  },
  {
    name: 'Universal',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/8lvHyhjr8oUKOOy2dKXoALWKdp0.png',
    url: '/discover/movies/studio/33',
  },
  {
    name: 'Paramount',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/fycMZt242LVjagMByZOLUGbCvv3.png',
    url: '/discover/movies/studio/4',
  },
  {
    name: 'Pixar',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png',
    url: '/discover/movies/studio/3',
  },
  {
    name: 'Dreamworks',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/kP7t6RwGz2AvvTkvnI1uteEwHet.png',
    url: '/discover/movies/studio/521',
  },
  {
    name: 'Marvel Studios',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/hUzeosd33nzE5MCNsZxCGEKTXaQ.png',
    url: '/discover/movies/studio/420',
  },
  {
    name: 'DC',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/2Tc1P3Ac8M479naPp1kYT3izLS5.png',
    url: '/discover/movies/studio/9993',
  },
];

const StudioSlider: React.FC = () => {
  const intl = useIntl();

  return (
    <>
      <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center text-xl leading-7 text-gray-300 cursor-default sm:text-2xl sm:leading-9 sm:truncate">
            <span>{intl.formatMessage(messages.studios)}</span>
          </div>
        </div>
      </div>
      <Slider
        sliderKey="studios"
        isLoading={false}
        isEmpty={false}
        items={studios.map((studio, index) => (
          <CompanyCard
            key={`studio-${index}`}
            name={studio.name}
            image={studio.image}
            url={studio.url}
          />
        ))}
        emptyMessage=""
      />
    </>
  );
};

export default StudioSlider;
