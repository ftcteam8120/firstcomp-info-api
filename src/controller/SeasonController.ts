import { Controller, Query, Authorized } from 'vesper';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { Paginator } from '../util/Paginator';
import { SeasonOrder } from '../entity/Season';
import { SeasonRepository } from '../repository/SeasonRepository';

@Controller()
export class SeasonController {

  constructor(
    private seasonRepository: SeasonRepository,
    private paginator: Paginator
  ) { }

  @Query()
  @Authorized(['season:read'])
  async seasons({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.seasonRepository.find(first || 100, after, filter, orderBy),
      after
    );
  }

  @Query()
  @Authorized(['season:read'])
  season({ id }) {
    return this.seasonRepository.findById(id);
  }

  @Query()
  @Authorized(['season:read'])
  seasonByYear({ program, year }) {
    return this.seasonRepository.findByYear(program, year);
  }

}
