import { Resolver, Resolve } from 'vesper';
import { Team } from '../entity/Team';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';

@Resolver(Team)
export class TeamResolver {

  constructor(
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) {}

  @Resolve()
  season(team: Team) {
    if (team.seasonId) {
      return this.firstSearch.findSeason(team.seasonId);
    }
    return null;
  }

  @Resolve()
  country(team: Team) {
    return this.firstSearch.findCountry(this.idGenerator.country(team.countryCode));
  }

}
