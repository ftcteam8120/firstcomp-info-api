import { Controller, Query } from 'vesper';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { Paginator } from '../util/Paginator';
import { CountryOrder } from '../entity/Country';

@Controller()
export class CountryController {

  constructor(
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private paginator: Paginator
  ) { }

  @Query()
  async countries({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.firstSearch.findCountries(first || 300, after, filter, orderBy),
      after
    );
  }

  @Query()
  country({ id }) {
    return this.firstSearch.findCountry(id);
  }

  @Query()
  countryByCode({ code }) {
    return this.firstSearch.findCountry(this.idGenerator.country(code));
  }

}
