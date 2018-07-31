import { Resolver, Resolve, Authorized } from 'vesper';
import { Team, Program } from '../entity/Team';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { TheOrangeAlliance } from '../service/TheOrangeAlliance';

@Resolver(Team)
export class TeamResolver {

  constructor(
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private theBlueAlliance: TheBlueAlliance,
    private theOrangeAlliance: TheOrangeAlliance
  ) {}

  @Resolve()
  @Authorized(['season:read'])
  season(team: Team) {
    if (team.seasonId) {
      return this.firstSearch.findSeason(team.seasonId);
    }
    if (team.season) {
      return this.firstSearch.findSeasonByYear(team.program, team.season);
    }
    return null;
  }

  @Resolve()
  @Authorized(['country:read'])
  country(team: Team) {
    return this.firstSearch.findCountry(this.idGenerator.country(team.countryCode));
  }

  @Resolve()
  @Authorized(['robot:read'])
  robots(team: Team) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamRobots(team);
  }

  @Resolve()
  @Authorized(['award:read'])
  awards(team: Team) {
    if (team.program === Program.FRC) {
      return this.theBlueAlliance.findTeamAwards(team);
    }
    if (team.program === Program.FTC) {
      return this.theOrangeAlliance.findTeamAwards(team);
    }
    return [];
  }

  @Resolve()
  @Authorized(['event:read'])
  events(team: Team) {
    if (team.program === Program.FRC) {
      return this.theBlueAlliance.findTeamEvents(team);
    }
    if (team.program === Program.FTC) {
      return this.theOrangeAlliance.findTeamEvents(team);
    }
    return [];
  }

  @Resolve()
  @Authorized(['media:read'])
  media(team: Team, { year }) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamMedia(team, year);
  }

  @Resolve()
  @Authorized(['social_media:read'])
  socialMedia(team: Team) {
    if (team.program !== Program.FRC) return [];
    return this.theBlueAlliance.findTeamSocialMedia(team);
  }

}
