import { Resolver, Resolve } from 'vesper';
import { Event } from '../entity/Event';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';

@Resolver(Event)
export class EventResolver {

  constructor(
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) {}

  @Resolve()
  country(event: Event) {
    return this.firstSearch.findCountry(this.idGenerator.country(event.countryCode));
  }

}
