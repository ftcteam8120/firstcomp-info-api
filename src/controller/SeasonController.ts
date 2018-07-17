import { Controller, Query, Authorized } from 'vesper';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { Paginator } from '../util/Paginator';
import { SeasonOrder } from '../entity/Season';

@Controller()
export class SeasonController {

  constructor(
    private firstSearch: FIRSTSearch,
    private paginator: Paginator
  ) { }

  @Query()
  @Authorized(['season:read'])
  async seasons({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.firstSearch.findSeasons(first || 100, after, filter, orderBy),
      after
    );
  }

  @Query()
  @Authorized(['season:read'])
  season({ id }) {
    return this.firstSearch.findSeason(id);
  }

  @Query()
  @Authorized(['season:read'])
  seasonByYear({ program, year }) {
    return this.firstSearch.findSeasonByYear(program, year);
  }

}
