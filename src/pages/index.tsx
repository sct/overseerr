import React from 'react';
import type { NextPage } from 'next';
import TitleCard from '../components/TitleCard';

const Index: NextPage = () => {
  return (
    <>
      <TitleCard
        image="image.tmdb.org/t/p/w600_and_h900_bestv2/iZf0KyrE25z1sage4SYFLCCrMi9.jpg"
        year="2019"
        summary="Greatest movie ever"
        title="1918"
        userScore={98}
        status="Not Requested"
      />
    </>
  );
};

export default Index;
