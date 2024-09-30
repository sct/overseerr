import ArtistDetails from '@app/components/MusicDetails/ArtistDetails';
import ReleaseDetails from '@app/components/MusicDetails/ReleaseDetails';
import ReleaseGroupDetails from '@app/components/MusicDetails/ReleaseGroupDetails';
import Error from '@app/pages/_error';
import { SecondaryType } from '@server/constants/media';
import type {
  ArtistResult,
  ReleaseGroupResult,
  ReleaseResult,
} from '@server/models/Search';
import 'country-flag-icons/3x2/flags.css';
import { useRouter } from 'next/router';
import useSWR from 'swr';

interface MusicDetailsProps {
  type: SecondaryType;
  artist?: ArtistResult;
  releaseGroup?: ReleaseGroupResult;
  release?: ReleaseResult;
}

const MusicDetails = ({
  type,
  artist,
  releaseGroup,
  release,
}: MusicDetailsProps) => {
  const router = useRouter();
  const { data: fetched } = useSWR<
    ArtistResult | ReleaseGroupResult | ReleaseResult
  >(
    `/api/v1/music/${router.query.type}/${router.query.mbId}?full=true&maxElements=50`
  );

  switch (type) {
    case SecondaryType.ARTIST:
      return <ArtistDetails artist={(fetched ?? artist) as ArtistResult} />;
    case SecondaryType.RELEASE_GROUP:
      return (
        <ReleaseGroupDetails
          releaseGroup={(fetched ?? releaseGroup) as ReleaseGroupResult}
        />
      );
    case SecondaryType.RELEASE:
      return <ReleaseDetails release={(fetched ?? release) as ReleaseResult} />;
    default:
      return <Error statusCode={404} />;
  }
};

export default MusicDetails;
