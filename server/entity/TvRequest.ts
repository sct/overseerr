import { MediaRequest } from './MediaRequest';
import { ChildEntity, OneToMany } from 'typeorm';
import SeasonRequest from './SeasonRequest';
import { MediaType } from '../constants/media';

@ChildEntity(MediaType.TV)
class TvRequest extends MediaRequest {
  @OneToMany(() => SeasonRequest, (season) => season.request)
  public seasons: SeasonRequest[];

  constructor(init?: Partial<TvRequest>) {
    super(init);
  }
}

export default TvRequest;
