import React from 'react';
import { NextPage } from 'next';
import type { MovieDetails as MovieDetailsType } from '../../../../server/models/Movie';
import MovieDetails from '../../../components/MovieDetails';
import axios from 'axios';

interface MoviePageProps {
  movie?: MovieDetailsType;
}

const MoviePage: NextPage<MoviePageProps> = ({ movie }) => {
  return <MovieDetails movie={movie} />;
};

MoviePage.getInitialProps = async (ctx) => {
  if (ctx.req) {
    const response = await axios.get<MovieDetailsType>(
      `http://localhost:${process.env.PORT || 3000}/api/v1/movie/${
        ctx.query.movieId
      }`,
      { headers: ctx.req ? { cookie: ctx.req.headers.cookie } : undefined }
    );

    return {
      movie: response.data,
    };
  }

  return {};
};

export default MoviePage;
