import { Service } from 'typedi';
import { RedisCache } from '../util/RedisCache';
import { Event, EventType, EventFilter, EventOrder } from '../entity/Event';
import { Team, Program, TeamFilter, TeamOrder } from '../entity/Team';
import { ElasticSearch, ElasticResult } from '../util/ElasticSearch';
import { IDGenerator } from '../util/IDGenerator';
import { Season, SeasonFilter, SeasonOrder } from '../entity/Season';
import { Country, CountryFilter, CountryOrder } from '../entity/Country';

export interface FindResult<T> {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  data: T[];
}

export interface SeasonQueryParams {
  program: Program;
}

@Service()
export class FIRSTSearch {

  constructor(
    private redisCache: RedisCache,
    private elasticSearch: ElasticSearch,
    private idGenerator: IDGenerator
  ) { }

  private convertAll<T>(
    result: ElasticResult,
    first: number,
    after: string,
    converter: (nodeRaw: any) => T
  ): FindResult<T> {
    const nodes: T[] = [];
    let nodeRaw: any;
    if (result.totalCount > 0) {
      for (let i = 0; i < result.hits.length; i += 1) {
        nodeRaw = result.hits[i];
        nodes.push(converter(nodeRaw));
      }
    }
    // Remove the last result if it is over the size limit
    if (result.hits.length === (first + 1)) {
      nodes.pop();
    }
    return {
      totalCount: result.totalCount,
      hasNextPage: result.hits[(first + 1) - 1] ? true : false,
      hasPreviousPage: after ? true : false,
      data: nodes
    };
  }

  private convertTeam(id: string, data: any): Team {
    return {
      id,
      internalId: data.id,
      number: data.team_number_yearly,
      program: data.team_type,
      name: data.team_nickname,
      schoolName: data.team_name_calc,
      city: data.team_city,
      stateProv: data.team_stateprov,
      countryCode: data.team_country,
      rookieYear: data.team_rookieyear,
      website: data.team_web_url,
      profileYear: data.profile_year,
      seasonId: data.fk_program_seasons ? this.idGenerator.season(data.fk_program_seasons) : null
    };
  }

  private teamOrderDict = {
    id: '_id',
    program: 'team_type',
    number: 'team_number_yearly',
    name: 'team_nickname',
    schoolName: 'team_name_calc',
    city: 'team_city',
    stateProv: 'team_stateprov',
    countryCode: 'team_country',
    rookieYear: 'team_rookieyear',
    website: 'team_web_url',
    profileYear: 'profile_year'
  };

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
      countryCode: data.event_country,
      stateProv: data.event_stateprov,
      dateStart: data.date_start,
      dateEnd: data.date_end,
      type: this.convertEventType(data.event_subtype),
      website: data.event_web_url,
      program: data.event_type
    };
  }

  private eventOrderDict = {
    id: '_id',
    code: 'event_code',
    name: 'event_name',
    description: 'event_description',
    address: 'event_address1',
    venue: 'event_venue',
    city: 'event_city',
    countryCode: 'event_country',
    stateProv: 'event_stateprov',
    dateStart: 'date_start',
    dateEnd: 'date_end',
    website: 'event_web_url',
    program: 'event_type'
  };

  private convertSeason(id: string, data: any): Season {
    return {
      id,
      program: data.program_code,
      name: data.season_name,
      startYear: data.season_year_start
    };
  }

  private seasonOrderDict = {
    id: '_id',
    program: 'program_code',
    name: 'season_name',
    startYear: 'season_year_start'
  };

  private convertCountry(id: string, data: any): Country {
    return {
      id,
      name: data.iso_country_name,
      code: data.iso_country_code
    };
  }

  private countryOrderDict = {
    id: '_id',
    name: 'iso_country_name',
    code: 'iso_country_code'
  };
  
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
   * Converts a readable event subtype into an EventType enum value
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
   * @param first How many teams to fetch
   * @param after A cursor to find teams after
   * @param filter An object containing filters
   * @param orderBy An array of TeamOrder enums
   */
  public findTeams(
    first: number,
    after?: string,
    filter: TeamFilter = {},
    orderBy: TeamOrder[] = []
  ): Promise<FindResult<Team>> {
    const seasonId = filter.season ?
      this.idGenerator.decodeSeason(filter.season).internalId :
      undefined;
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.teamOrderDict, orderBy ? orderBy : []),
      query: this.elasticSearch.buildQuery({
        team_type: filter.program,
        fk_program_seasons: seasonId,
        profile_year: filter.profileYear
      })
    }).then((result: ElasticResult) => {
      const converted = this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertTeam(
          this.idGenerator.team(nodeRaw.team_type, nodeRaw.team_number_yearly),
          nodeRaw
        );
      });
      // Cache all teams
      const cachePromises = [];
      for (const node of converted.data) {
        cachePromises.push(this.redisCache.set(node));
      }
      return Promise.all(cachePromises).then(() => {
        return converted;
      });
    });
  }

  /**
   * Find all events
   * @param first How many events to fetch
   * @param after A cursor to find events after
   * @param filter An object containing filters
   * @param orderBy An array of EventOrder enums
   */
  public findEvents(
    first: number,
    after?: string,
    filter: EventFilter = {},
    orderBy: EventOrder[] = []
  ): Promise<FindResult<Event>> {
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.eventOrderDict, orderBy ? orderBy : []),
      query: this.elasticSearch.buildQuery(filter ? {
        event_type: filter.program
      } : {})
    }).then((result: ElasticResult) => {
      const converted = this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertEvent(this.idGenerator.event(nodeRaw.event_code), nodeRaw);
      });
      // Cache all events
      const cachePromises = [];
      for (const node of converted.data) {
        cachePromises.push(this.redisCache.set(node));
      }
      return Promise.all(cachePromises).then(() => {
        return converted;
      });
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

  public findSeasons(
    first: number,
    after?: string,
    filter: SeasonFilter = {},
    orderBy: SeasonOrder[] = []
  ): Promise<FindResult<Season>> {
    return this.elasticSearch.query('https://es01.usfirst.org/seasons/_search', {
      size: first + 1 | 101,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      query: this.elasticSearch.buildQuery({
        program_code: filter.program,
        season_year_start: filter.startYear
      }),
      sort: this.elasticSearch.buildSort(this.seasonOrderDict, orderBy)
    }, true).then((result: ElasticResult) => {
      const converted = this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertSeason(
          this.idGenerator.season(nodeRaw.id),
          nodeRaw
        );
      });
      // Cache all seasons
      const cachePromises = [];
      for (const node of converted.data) {
        cachePromises.push(this.redisCache.set(node));
      }
      return Promise.all(cachePromises).then(() => {
        return converted;
      });
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
          query: `first_country_code: ${countryData.code}`
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

  public findCountries(
    first: number,
    after?: string,
    filter: CountryFilter = {},
    orderBy: CountryOrder[] = []
  ): Promise<FindResult<Country>> {
    return this.elasticSearch.query('https://es01.usfirst.org/countries/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      query: this.elasticSearch.buildQuery({
        iso_country_code: filter.code
      }),
      sort: this.elasticSearch.buildSort(this.countryOrderDict, orderBy)
    }, true).then((result: ElasticResult) => {
      const converted = this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertCountry(
          this.idGenerator.country(nodeRaw.iso_country_code),
          nodeRaw
        );
      });
      // Cache all countries
      const cachePromises = [];
      for (const node of converted.data) {
        cachePromises.push(this.redisCache.set(node));
      }
      return Promise.all(cachePromises).then(() => {
        return converted;
      });
    });
  }

}
