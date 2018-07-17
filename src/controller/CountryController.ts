import { Controller, Query, Authorized } from 'vesper';
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
  @Authorized(['country:read'])
  async countries({ first, after, filter, orderBy }) {
    return this.paginator.paginate(
      await this.firstSearch.findCountries(first || 300, after, filter, orderBy),
      after
    );
  }

  @Query()
  @Authorized(['country:read'])
  country({ id }) {
    return this.firstSearch.findCountry(id);
  }

  @Query()
  @Authorized(['country:read'])
  countryByCode({ code }) {
    return this.firstSearch.findCountry(this.idGenerator.country(code));
  }

}
