import { Service } from 'typedi';
import { RedisCache } from '../util/RedisCache';
import { Event, EventType } from '../entity/Event';
import { Team, Program } from '../entity/Team';
import { ElasticSearch, ElasticResult } from '../util/ElasticSearch';
import { IDGenerator } from '../util/IDGenerator';
import { Season } from '../entity/Season';
import { Country } from '../entity/Country';

export interface FindResult<T> {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: T[];
}

export interface SeasonQueryParams {
  program: Program;
}

export interface TeamsQueryParams {
  program: Program;
  season: string;
}

export interface EventQueryParams {
  program: Program;
}

@Service()
export class FIRSTSearch {

  constructor(
    private redisCache: RedisCache,
    private elasticSearch: ElasticSearch,
    private idGenerator: IDGenerator
  ) { }

  private convertTeam(id: string, data: any): Team {
    return {
      id,
      internalId: data.id,
      number: data.team_number_yearly,
      program: data.team_type,
      nameFull: data.team_nickname,
      nameShort: data.team_nickname,
      schoolName: data.team_name_calc,
      city: data.team_city,
      stateProv: data.team_stateprov,
      countryCode: data.countryCode,
      rookieYear: data.team_rookieyear,
      website: data.team_web_url,
      seasonId: data.fk_program_seasons ? this.idGenerator.season(data.fk_program_seasons) : null
    };
  }

  private convertEvent(id: string, data: any): Event {
    return {
      id,
      internalId: data.id,
      code: data.event_code,
      name: data.event_name,
      description: data.event_description,
      address: data.event_address1 +
        (data.event_address2 ? ' ' + data.event_address2 : ''),
      venue: data.event_venue,
      city: data.event_city,
      country: data.event_country,
      stateProv: data.event_stateprov,
      dateStart: data.date_start,
      dateEnd: data.date_end,
      type: this.convertEventType(data.event_subtype),
      website: data.event_web_url,
      program: data.event_type
    };
  }

  private convertSeason(id: string, data: any): Season {
    return {
      id,
      program: data.program_code,
      name: data.season_name,
      startYear: data.season_year_start
    };
  }

  private convertCountry(id: string, data: any): Country {
    return {
      id,
      name: data.iso_country_name,
      code: data.iso_country_code
    };
  }
  
  /**
   * Finds a FIRST team
   * @param id The team ID
   */
  public async findTeam(id: string): Promise<Team> {
    // Check for a cached value
    const cached = await this.redisCache.get<Team>(id);
    const teamData = this.idGenerator.decodeTeam(id);
    if (cached) return cached;
    // Otherwise, query the server
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      query: {
        query_string: {
          query: `team_number_yearly: ${teamData.number} AND team_type: ${teamData.program}`
        }
      },
      sort: {
        profile_year: {
          order: 'desc' // Order results by profile year descending
        }
      }
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) {
        return null;
      }
      const teamRaw = result.hits[0];
      const team: Team = this.convertTeam(id, teamRaw);
      // Cache the team
      return this.redisCache.set(team).then(() => {
        return team;
      });
    });
  }

  /**
   * Converts a readable event subtype into an EventTypeEnum value
   * @param input The raw event subtype
   */
  public convertEventType(input: string): EventType {
    // Remove all spaces from the event type and capitalize
    let processed = input.replace(' / ', '_').replace(' ', '_').toUpperCase();
    try {
      // Check if the first character is a number
      if (parseInt(processed[0], 2)) {
        // If it is, add a leading underscore
        processed = '_' + processed;
      }
    } catch { }
    for (const type in EventType) {
      // Check against the enum values
      if (EventType[type] === processed) return EventType[type] as EventType;
    }
    // Return null if we cannot determine the event type
    return null;
  }

  /**
   * Finds a FIRST event
   * @param id The event ID
   */
  public async findEvent(id: string): Promise<Event> {
    // Check for a cached value
    const cached = await this.redisCache.get<Event>(id);
    const eventData = this.idGenerator.decodeEvent(id);
    if (cached) return cached;
    // Otherwise, query the server
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      query: {
        query_string: {
          query: `event_code: ${eventData.code}`
        }
      }
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) {
        return null;
      }
      const eventRaw = result.hits[0];
      const event: Event = this.convertEvent(id, eventRaw);
      // Cache the event
      return this.redisCache.set(event).then(() => {
        return event;
      });
    });
  }

  /**
   * Find all teams
   * @param first How many teams to find (defaults to 10)
   * @param after A team cursor
   */
  public findTeams(first: number, after?: string, query?: TeamsQueryParams):
    Promise<FindResult<Team>> {
    const seasonId = query.season ?
      this.idGenerator.decodeSeason(query.season).internalId :
      undefined;
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: {
        _id: 'desc'
      },
      query: this.elasticSearch.buildQuery({
        team_type: query.program,
        fk_program_seasons: seasonId
      })
    }).then((result: ElasticResult) => {
      const teams: Team[] = [];
      let teamRaw: any;
      let team: Team;
      if (result.totalCount > 0) {
        for (let i = 0; i < result.hits.length; i += 1) {
          teamRaw = result.hits[i];
          team = this.convertTeam(
            this.idGenerator.team(teamRaw.team_type, teamRaw.team_number_yearly),
            teamRaw
          );
          teams.push(team);
        }
      }
      // Remove the last result if it is over the size limit
      if (result.hits.length === (first + 1)) {
        teams.pop();
      }
      return {
        totalCount: result.totalCount,
        hasNextPage: result.hits[(first + 1) - 1] ? true : false,
        hasPreviousPage: after ? true : false,
        data: teams
      };
    });
  }

  /**
   * Find all events
   * @param first How many events to find (defaults to 10)
   * @param after An event cursor
   */
  public findEvents(first: number, after?: string, query?: EventQueryParams):
    Promise<FindResult<Event>> {
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: {
        _id: 'desc'
      },
      query: this.elasticSearch.buildQuery({
        event_type: query.program
      })
    }).then((result: ElasticResult) => {
      const events: Event[] = [];
      let eventRaw: any;
      let event: Event;
      if (result.totalCount > 0) {
        for (let i = 0; i < result.hits.length; i += 1) {
          eventRaw = result.hits[i];
          event = this.convertEvent(this.idGenerator.event(eventRaw.event_code), eventRaw);
          events.push(event);
        }
      }
      // Remove the last result if it is over the size limit
      if (result.hits.length === (first + 1)) {
        events.pop();
      }
      return {
        totalCount: result.totalCount,
        hasNextPage: result.hits[(first + 1) - 1] ? true : false,
        hasPreviousPage: after ? true : false,
        data: events
      };
    });
  }

  public async findSeason(id: string): Promise<Season> {
    // Check for a cached value
    const cached = await this.redisCache.get<Season>(id);
    const seasonData = this.idGenerator.decodeSeason(id);
    if (cached) return cached;
    return this.elasticSearch.query('https://es01.usfirst.org/seasons/_search', {
      query: {
        query_string: {
          query: `id: ${seasonData.internalId}`
        }
      }
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) {
        return null;
      }
      const seasonRaw = result.hits[0];
      const season = this.convertSeason(id, seasonRaw);
      // Cache the season
      return this.redisCache.set(season).then(() => {
        return season;
      });
    });
  }

  public findSeasonByYear(program: Program, year: number): Promise<Season> {
    return this.elasticSearch.query('https://es01.usfirst.org/seasons/_search', {
      query: this.elasticSearch.buildQuery({
        program_code: program,
        season_year_start: year
      })
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) {
        return null;
      }
      const seasonRaw = result.hits[0];
      return this.convertSeason(this.idGenerator.season(seasonRaw.id), seasonRaw);
    });
  }

  public findSeasons(first: number, after?: string, query?: SeasonQueryParams):
    Promise<FindResult<Season>> {
    return this.elasticSearch.query('https://es01.usfirst.org/seasons/_search', {
      size: first + 1 | 101,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      query: this.elasticSearch.buildQuery({
        program_code: query.program
      }),
      sort: {
        season_year_start: {
          order: 'desc'
        },
        program_code: {
          order: 'desc'
        }
      }
    }).then((result: ElasticResult) => {
      const seasons: Season[] = [];
      let seasonRaw: any;
      let season: Season;
      if (result.totalCount > 0) {
        for (let i = 0; i < result.hits.length; i += 1) {
          seasonRaw = result.hits[i];
          season = this.convertSeason(
            this.idGenerator.season(seasonRaw.id),
            seasonRaw
          );
          seasons.push(season);
        }
      }
      // Remove the last result if it is over the size limit
      if (result.hits.length === (first + 1)) {
        seasons.pop();
      }
      return {
        totalCount: result.totalCount,
        hasNextPage: result.hits[(first + 1) - 1] ? true : false,
        hasPreviousPage: after ? true : false,
        data: seasons
      };
    });
  }

  public async findCountry(id: string): Promise<Country> {
    // Check for a cached value
    const cached = await this.redisCache.get<Country>(id);
    const countryData = this.idGenerator.decodeCountry(id);
    if (cached) return cached;
    return this.elasticSearch.query('https://es01.usfirst.org/countries/_search', {
      query: {
        query_string: {
          query: `iso_country_code: ${countryData.code}`
        }
      }
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) {
        return null;
      }
      const countryRaw = result.hits[0];
      const country = this.convertCountry(id, countryRaw);
      // Cache the country
      return this.redisCache.set(country).then(() => {
        return country;
      });
    });
  }

  public findCountries(first: number, after?: string):
    Promise<FindResult<Country>> {
    return this.elasticSearch.query('https://es01.usfirst.org/countries/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0
    }).then((result: ElasticResult) => {
      const countries: Country[] = [];
      let countryRaw: any;
      let country: Country;
      if (result.totalCount > 0) {
        for (let i = 0; i < result.hits.length; i += 1) {
          countryRaw = result.hits[i];
          country = this.convertCountry(
            this.idGenerator.country(countryRaw.iso_country_code),
            countryRaw
          );
          countries.push(country);
        }
      }
      // Remove the last result if it is over the size limit
      if (result.hits.length === (first + 1)) {
        countries.pop();
      }
      return {
        totalCount: result.totalCount,
        hasNextPage: result.hits[(first + 1) - 1] ? true : false,
        hasPreviousPage: after ? true : false,
        data: countries
      };
    });
  }

}
