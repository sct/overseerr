import CompanyCard from '@app/components/CompanyCard';
import Slider from '@app/components/Slider';
import TheMovieDb from '@server/api/themoviedb';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  networks: 'Networks',
});

interface Network {
  id: number;
  name: string;
  image: string;
  url: string;
}

const defaultNetworkIds: number[] = [
  213, 2739, 1024, 2552, 453, 49, 4353, 2, 19, 359, 174, 67, 318, 71, 6, 16,
  4330, 4, 56, 80, 13, 3353,
];

const additionalNetworkIds = process.env.NEXT_PUBLIC_NETWORK_IDS
  ? process.env.NEXT_PUBLIC_NETWORK_IDS.split(',')
      .map((id) => Number(id.trim()))
      .filter(Boolean)
  : [];

const filteredAdditionalNetworkIds = additionalNetworkIds.filter(
  (id) => !defaultNetworkIds.includes(id)
);

const NetworkSlider = () => {
  const intl = useIntl();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [additionalNetworks, setAdditionalNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAdditional, setLoadingAdditional] = useState(false);

  const tmdb = new TheMovieDb();

  useEffect(() => {
    const fetchNetworks = async () => {
      setLoading(true);
      const results: Network[] = await Promise.all(
        defaultNetworkIds.map(async (id) => {
          const network = await tmdb.getNetwork(Number(id));
          return {
            id: id,
            name: network.name,
            image: network.logo_path
              ? `https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)${network.logo_path}`
              : '',
            url: `/discover/tv/network/${id}`,
          };
        })
      );
      setNetworks(results);
      setLoading(false);
    };

    const fetchAdditionalNetworks = async () => {
      setLoadingAdditional(true);
      const results: Network[] = await Promise.all(
        filteredAdditionalNetworkIds.map(async (id) => {
          const network = await tmdb.getNetwork(Number(id));
          return {
            id: id,
            name: network.name,
            image: network.logo_path
              ? `https://image.tmdb.org/t/p/w780_filter(duotone,ffffff,bababa)${network.logo_path}`
              : '',
            url: `/discover/tv/network/${id}`,
          };
        })
      );
      setAdditionalNetworks(results);
      setLoadingAdditional(false);
    };

    fetchNetworks();
    if (filteredAdditionalNetworkIds.length > 0) {
      fetchAdditionalNetworks();
    } else {
      setLoadingAdditional(false);
    }
  }, []);

  return (
    <>
      <div className="slider-header">
        <div className="slider-title">
          <span>{intl.formatMessage(messages.networks)}</span>
        </div>
      </div>
      <Slider
        sliderKey="networks"
        isLoading={loading}
        isEmpty={!loading && networks.length === 0}
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
      {filteredAdditionalNetworkIds.length > 0 && (
        <>
          <div className="slider-header">
            <div className="slider-title">
              <span>
                {intl.formatMessage({ defaultMessage: 'Additional Networks' })}
              </span>
            </div>
          </div>
          <Slider
            sliderKey="additional-networks"
            isLoading={loadingAdditional}
            isEmpty={!loadingAdditional && additionalNetworks.length === 0}
            items={additionalNetworks.map((network, index) => (
              <CompanyCard
                key={`additional-network-${index}`}
                name={network.name}
                image={network.image}
                url={network.url}
              />
            ))}
            emptyMessage=""
          />
        </>
      )}
    </>
  );
};

export default NetworkSlider;
