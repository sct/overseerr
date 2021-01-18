import axios, { AxiosInstance } from 'axios';
import xml2js from 'xml2js';

export interface SearchResult {
  tvdbId: number;
  mediaName: string;
  year: string | null;
}

interface Show {
  id: string[];
  seriesid: string[];
  SeriesName: string[];
  FirstAired: string[];
}

class TvdbApi {
  private axios: AxiosInstance;

  constructor() {
    this.axios = axios.create({
      baseURL: 'https://www.thetvdb.com/api',
      headers: {
        'Content-Type': 'application/xml',
        Accept: 'application/xml',
      },
    });
  }

  public async getShowsByName(
    title: string
  ): Promise<{ result: SearchResult[] }> {
    const response = await this.axios.get(
      `/GetSeries.php?seriesname=${title}`,
      {
        transformResponse: [],
        responseType: 'text',
      }
    );

    const parsedXml = await xml2js.parseStringPromise(response.data);

    console.log(parsedXml.Data.Series);

    const searchResults: SearchResult[] = parsedXml.Data.Series.map(
      (show: Show) => {
        return {
          tvdbId: parseInt(show.seriesid[0] || show.id[0]),
          mediaName: show.SeriesName[0],
          year: show.FirstAired[0] ? show.FirstAired[0].slice(0, 4) : null,
        };
      }
    );

    return { result: searchResults };
  }
}

export default TvdbApi;
