import { Resolver, Resolve } from 'vesper';
import { Team, Program } from '../entity/Team';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { TheBlueAlliance } from '../service/TheBlueAlliance';

@Resolver(Team)
export class TeamResolver {

  constructor(
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private theBlueAlliance: TheBlueAlliance
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

  @Resolve()
  robots(team: Team) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamRobots(team);
  }

  @Resolve()
  awards(team: Team) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamAwards(team);
  }

  @Resolve()
  events(team: Team) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamEvents(team);
  }

  @Resolve()
  media(team: Team, { year }) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamMedia(team, year);
  }

  @Resolve()
  socialMedia(team: Team) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamSocialMedia(team);
  }

}
