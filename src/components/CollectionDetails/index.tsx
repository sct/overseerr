import axios from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useToasts } from 'react-toast-notifications';
import useSWR from 'swr';
import { MediaStatus } from '../../../server/constants/media';
import type { MediaRequest } from '../../../server/entity/MediaRequest';
import type { Collection } from '../../../server/models/Collection';
import { LanguageContext } from '../../context/LanguageContext';
import globalMessages from '../../i18n/globalMessages';
import Error from '../../pages/_error';
import Badge from '../Common/Badge';
import Button from '../Common/Button';
import LoadingSpinner from '../Common/LoadingSpinner';
import Modal from '../Common/Modal';
import Slider from '../Slider';
import TitleCard from '../TitleCard';
import Transition from '../Transition';

const messages = defineMessages({
  overviewunavailable: 'Overview unavailable',
  overview: 'Overview',
  movies: 'Movies',
  numberofmovies: 'Number of Movies: {count}',
  requesting: 'Requesting…',
  request: 'Request',
  requestcollection: 'Request Collection',
  requestswillbecreated:
    'The following titles will have requests created for them:',
  requestSuccess: '<strong>{title}</strong> successfully requested!',
});

interface CollectionDetailsProps {
  collection?: Collection;
}

const CollectionDetails: React.FC<CollectionDetailsProps> = ({
  collection,
}) => {
  const intl = useIntl();
  const router = useRouter();
  const { addToast } = useToasts();
  const { locale } = useContext(LanguageContext);
  const [requestModal, setRequestModal] = useState(false);
  const [isRequesting, setRequesting] = useState(false);
  const { data, error, revalidate } = useSWR<Collection>(
    `/api/v1/collection/${router.query.collectionId}?language=${locale}`,
    {
      initialData: collection,
      revalidateOnMount: true,
    }
  );

  if (!data && !error) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return <Error statusCode={404} />;
  }

  const requestableParts = data.parts.filter(
    (part) => !part.mediaInfo || part.mediaInfo.status === MediaStatus.UNKNOWN
  );

  const requestBundle = async () => {
    try {
      setRequesting(true);
      await Promise.all(
        requestableParts.map(async (part) => {
          await axios.post<MediaRequest>('/api/v1/request', {
            mediaId: part.id,
            mediaType: 'movie',
          });
        })
      );

      addToast(
        <span>
          {intl.formatMessage(messages.requestSuccess, {
            title: data?.name,
            strong: function strong(msg) {
              return <strong>{msg}</strong>;
            },
          })}
        </span>,
        { appearance: 'success', autoDismiss: true }
      );
    } catch (e) {
      addToast('Something went wrong requesting the collection.', {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      setRequesting(false);
      setRequestModal(false);
      revalidate();
    }
  };

  return (
    <div
      className="px-4 pt-4 -mx-4 -mt-2 bg-center bg-cover sm:px-8 "
      style={{
        height: 493,
        backgroundImage: `linear-gradient(180deg, rgba(17, 24, 39, 0.47) 0%, rgba(17, 24, 39, 1) 100%), url(//image.tmdb.org/t/p/w1920_and_h800_multi_faces/${data.backdropPath})`,
      }}
    >
      <Head>
        <title>{data.name} - Overseerr</title>
      </Head>
      <Transition
        enter="opacity-0 transition duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="opacity-100 transition duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        show={requestModal}
      >
        <Modal
          onOk={() => requestBundle()}
          okText={
            isRequesting
              ? intl.formatMessage(messages.requesting)
              : intl.formatMessage(messages.request)
          }
          okDisabled={isRequesting}
          okButtonType="primary"
          onCancel={() => setRequestModal(false)}
          title={intl.formatMessage(messages.requestcollection)}
          iconSvg={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          }
        >
          <p>{intl.formatMessage(messages.requestswillbecreated)}</p>
          <ul className="py-4 pl-8 list-disc">
            {data.parts
              .filter(
                (part) =>
                  !part.mediaInfo ||
                  part.mediaInfo?.status === MediaStatus.UNKNOWN
              )
              .map((part) => (
                <li key={`request-part-${part.id}`}>{part.title}</li>
              ))}
          </ul>
        </Modal>
      </Transition>
      <div className="flex flex-col items-center pt-4 md:flex-row md:items-end">
        <div className="flex-shrink-0 md:mr-4">
          <img
            src={`//image.tmdb.org/t/p/w600_and_h900_bestv2${data.posterPath}`}
            alt=""
            className="w-32 rounded shadow md:rounded-lg md:shadow-2xl md:w-52"
          />
        </div>
        <div className="flex flex-col mt-4 text-center text-white md:mr-4 md:mt-0 md:text-left">
          <div className="mb-2">
            {data.parts.every(
              (part) => part.mediaInfo?.status === MediaStatus.AVAILABLE
            ) && (
              <Badge badgeType="success">
                {intl.formatMessage(globalMessages.available)}
              </Badge>
            )}
            {!data.parts.every(
              (part) => part.mediaInfo?.status === MediaStatus.AVAILABLE
            ) &&
              data.parts.some(
                (part) => part.mediaInfo?.status === MediaStatus.AVAILABLE
              ) && (
                <Badge badgeType="success">
                  {intl.formatMessage(globalMessages.partiallyavailable)}
                </Badge>
              )}
          </div>
          <h1 className="text-2xl md:text-4xl">{data.name}</h1>
          <span className="mt-1 text-xs md:text-base md:mt-0">
            {intl.formatMessage(messages.numberofmovies, {
              count: data.parts.length,
            })}
          </span>
        </div>
        <div className="flex justify-end flex-1 mt-4 md:mt-0">
          {data.parts.some(
            (part) =>
              !part.mediaInfo || part.mediaInfo?.status === MediaStatus.UNKNOWN
          ) && (
            <Button buttonType="primary" onClick={() => setRequestModal(true)}>
              <svg
                className="w-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {intl.formatMessage(messages.requestcollection)}
            </Button>
          )}
        </div>
      </div>
      <div className="flex flex-col pt-8 pb-4 text-white md:flex-row">
        <div className="flex-1 md:mr-8">
          <h2 className="text-xl md:text-2xl">
            {intl.formatMessage(messages.overview)}
          </h2>
          <p className="pt-2 text-sm md:text-base">
            {data.overview
              ? data.overview
              : intl.formatMessage(messages.overviewunavailable)}
          </p>
        </div>
      </div>
      <div className="mt-6 mb-4 md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center text-xl leading-7 text-white sm:text-2xl sm:leading-9 sm:truncate">
            <span>{intl.formatMessage(messages.movies)}</span>
          </div>
        </div>
      </div>
      <Slider
        sliderKey="collection-movies"
        isLoading={false}
        isEmpty={data.parts.length === 0}
        items={data.parts.map((title) => (
          <TitleCard
            key={`collection-movie-${title.id}`}
            id={title.id}
            image={title.posterPath}
            status={title.mediaInfo?.status}
            summary={title.overview}
            title={title.title}
            userScore={title.voteAverage}
            year={title.releaseDate}
            mediaType={title.mediaType}
          />
        ))}
      />
      <div className="pb-8" />
    </div>
  );
};

export default CollectionDetails;
