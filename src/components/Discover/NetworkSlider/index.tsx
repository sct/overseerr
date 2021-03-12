import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import CompanyCard from '../../CompanyCard';
import Slider from '../../Slider';

const messages = defineMessages({
  networks: 'Networks',
});

interface Network {
  name: string;
  image: string;
  url: string;
}

const networks: Network[] = [
  {
    name: 'Netflix',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/wwemzKWzjKYJFfCeiB57q3r4Bcm.png',
    url: '/discover/tv/network/213',
  },
  {
    name: 'Disney+',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/gJ8VX6JSu3ciXHuC2dDGAo2lvwM.png',
    url: '/discover/tv/network/2739',
  },
  {
    name: 'Prime Video',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png',
    url: '/discover/tv/network/1024',
  },
  {
    name: 'HBO',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/tuomPhY2UtuPTqqFnKMVHvSb724.png',
    url: '/discover/tv/network/49',
  },
  {
    name: 'ABC',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ndAvF4JLsliGreX87jAc9GdjmJY.png',
    url: '/discover/tv/network/2',
  },
  {
    name: 'FOX',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/1DSpHrWyOORkL9N2QHX7Adt31mQ.png',
    url: '/discover/tv/network/19',
  },
  {
    name: 'Cinemax',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/6mSHSquNpfLgDdv6VnOOvC5Uz2h.png',
    url: '/discover/tv/network/359',
  },
  {
    name: 'AMC',
    image:
      'https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/pmvRmATOCaDykE6JrVoeYxlFHw3.png',
    url: '/discover/tv/network/174',
  },
  {
    name: 'Showtime',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/Allse9kbjiP6ExaQrnSpIhkurEi.png',
    url: '/discover/tv/network/67',
  },
  {
    name: 'Starz',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/8GJjw3HHsAJYwIWKIPBPfqMxlEa.png',
    url: '/discover/tv/network/318',
  },
  {
    name: 'The CW',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ge9hzeaU7nMtQ4PjkFlc68dGAJ9.png',
    url: '/discover/tv/network/71',
  },
  {
    name: 'NBC',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/o3OedEP0f9mfZr33jz2BfXOUK5.png',
    url: '/discover/tv/network/6',
  },
  {
    name: 'CBS',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/nm8d7P7MJNiBLdgIzUK0gkuEA4r.png',
    url: '/discover/tv/network/16',
  },
  {
    name: 'BBC One',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/mVn7xESaTNmjBUyUtGNvDQd3CT1.png',
    url: '/discover/tv/network/4',
  },
  {
    name: 'Cartoon Network',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/c5OC6oVCg6QP4eqzW6XIq17CQjI.png',
    url: '/discover/tv/network/56',
  },
  {
    name: 'Adult Swim',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/9AKyspxVzywuaMuZ1Bvilu8sXly.png',
    url: '/discover/tv/network/80',
  },
  {
    name: 'Nickelodeon',
    image:
      'http://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)/ikZXxg6GnwpzqiZbRPhJGaZapqB.png',
    url: '/discover/tv/network/13',
  },
];

const NetworkSlider: React.FC = () => {
  const intl = useIntl();

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.networks)}</span>
        </div>
      </div>
      <Slider
        sliderKey="networks"
        isLoading={false}
        isEmpty={false}
        items={networks.map((network, index) => (
          <CompanyCard
            key={`network-${index}`}
            name={network.name}
            image={network.image}
            url={network.url}
          />
        ))}
        emptyMessage=""
      />
    </>
  );
};

export default NetworkSlider;
