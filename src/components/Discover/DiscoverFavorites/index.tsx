import Header from '@app/components/Common/Header';
import ListView from '@app/components/Common/ListView';
import PageTitle from '@app/components/Common/PageTitle';
import useDiscover from '@app/hooks/useDiscover';
import Error from '@app/pages/_error';
import type { MovieResult, TvResult } from '@server/models/Search';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
    favorites: 'Favorites',
});

const DiscoverFavorites = () => {
    const intl = useIntl();

    const {
        isLoadingInitialData,
        isEmpty,
        isLoadingMore,
        isReachingEnd,
        titles,
        fetchMore,
        error,
    } = useDiscover<MovieResult | TvResult>('/api/v1/favorites');

    if (error) {
        return <Error statusCode={500} />;
    }

    const title = intl.formatMessage(messages.favorites);

    return (
        <>
            <PageTitle title={title} />
            <div className="mt-1 mb-5">
                <Header>{title}</Header>
            </div>
            <ListView
                items={titles as (MovieResult | TvResult)[]}
                isEmpty={isEmpty}
                isLoading={
                    isLoadingInitialData || (isLoadingMore && (titles?.length ?? 0) > 0)
                }
                isReachingEnd={isReachingEnd}
                onScrollBottom={fetchMore}
            />
        </>
    );
};

export default DiscoverFavorites;


