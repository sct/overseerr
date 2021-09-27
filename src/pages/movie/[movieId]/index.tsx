import axios from 'axios';
import { NextPage } from 'next';
import React from 'react';
import type { MovieDetails as MovieDetailsType } from '../../../../server/models/Movie';
import MovieDetails from '../../../components/MovieDetails';
import { getPath } from '../../../utils/pathBuilder';

interface MoviePageProps {
  movie?: MovieDetailsType;
}

const MoviePage: NextPage<MoviePageProps> = ({ movie }) => {
  return <MovieDetails movie={movie} />;
};

MoviePage.getInitialProps = async (ctx) => {
  if (ctx.req) {
    const requestPath = getPath(`/movie/${ctx.query.movieId}`);
    const response = await axios.get<MovieDetailsType>(
      `http://localhost:${process.env.PORT || 5055}${requestPath}`,
      {
        headers: ctx.req?.headers?.cookie
          ? { cookie: ctx.req.headers.cookie }
          : undefined,
      }
    );

    return {
      movie: response.data,
    };
  }

  return {};
};

export default MoviePage;
