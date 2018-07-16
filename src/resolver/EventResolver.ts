import { Resolver, Resolve } from 'vesper';
import { Event } from '../entity/Event';
import { Match } from '../entity/Match';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';

@Resolver(Event)
export class EventResolver {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) {}

  @Resolve()
  country(event: Event) {
    return this.firstSearch.findCountry(this.idGenerator.country(event.countryCode));
  }

  @Resolve()
  matches(event: Event) {
    return this.entityManager.find(Match, {
      event: event.code
    }).then((matches: Match[]) => {
      if (!matches) return [];
      // Add IDs to all the matches
      for (const match of matches) {
        match.id = this.idGenerator.match(match.number, match.event as string);
      }
      return matches;
    });
  }

}
