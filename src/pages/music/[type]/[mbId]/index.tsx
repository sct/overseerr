import LoadingSpinner from '@app/components/Common/LoadingSpinner';
import MusicDetails from '@app/components/MusicDetails';
import Error from '@app/pages/_error';
import { SecondaryType } from '@server/constants/media';
import type {
  ArtistResult,
  RecordingResult,
  ReleaseGroupResult,
  ReleaseResult,
  WorkResult,
} from '@server/models/Search';
import axios from 'axios';
import type { GetServerSideProps, NextPage } from 'next';

interface MusicPageProps {
  music?:
    | ArtistResult
    | ReleaseGroupResult
    | ReleaseResult
    | RecordingResult
    | WorkResult;
}

const MusicPage: NextPage<MusicPageProps> = ({ music }) => {
  if (!music) {
    return <LoadingSpinner />;
  }
  switch (music?.mediaType) {
    case SecondaryType.ARTIST:
      return <MusicDetails type={SecondaryType.ARTIST} artist={music} />;
    case SecondaryType.RELEASE_GROUP:
      return (
        <MusicDetails type={SecondaryType.RELEASE_GROUP} releaseGroup={music} />
      );
    case SecondaryType.RELEASE:
      return <MusicDetails type={SecondaryType.RELEASE} release={music} />;
    default:
      return <Error statusCode={404} />;
  }
};

export const getServerSideProps: GetServerSideProps<MusicPageProps> = async (
  ctx
) => {
  const response = await axios.get<
    | ArtistResult
    | ReleaseGroupResult
    | ReleaseResult
    | RecordingResult
    | WorkResult
  >(
    `http://localhost:${process.env.PORT || 5055}/api/v1/music/${
      ctx.query.type
    }/${ctx.query.mbId}`,
    {
      headers: ctx.req?.headers?.cookie
        ? { cookie: ctx.req.headers.cookie }
        : undefined,
    }
  );
  return {
    props: {
      music: response.data,
    },
  };
};

export default MusicPage;
