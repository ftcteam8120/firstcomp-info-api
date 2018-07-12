import { Controller, Query } from 'vesper';
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
  async seasons({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.firstSearch.findSeasons(first || 100, after, filter, orderBy),
      after
    );
  }

  @Query()
  season({ id }) {
    return this.firstSearch.findSeason(id);
  }

  @Query()
  seasonByYear({ program, year }) {
    return this.firstSearch.findSeasonByYear(program, year);
  }

}
