import { Service } from 'typedi';
import { RedisCache } from '../util/RedisCache';
import { Event, EventType, EventFilter, EventOrder } from '../entity/Event';
import { Team, Program, TeamFilter, TeamOrder } from '../entity/Team';
import { ElasticSearch, ElasticResult } from '../util/ElasticSearch';
import { IDGenerator } from '../util/IDGenerator';
import { Season, SeasonFilter, SeasonOrder } from '../entity/Season';
import { Country, CountryFilter, CountryOrder } from '../entity/Country';
import { TOAEvent } from './TheOrangeAlliance';
import { Location } from 'graphql';

export interface DateRange {
  gt: string;
  lt: string;
  gte: string;
  lte: string;
}

export enum Units {
  KM = 'km',
  MI = 'mi'
}

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
      sponsors: data.team_name_calc,
      city: data.team_city,
      stateProv: data.team_stateprov,
      countryCode: data.team_country,
      rookieYear: data.team_rookieyear,
      website: data.team_web_url,
      profileYear: data.profile_year,
      seasonId: data.fk_program_seasons ? this.idGenerator.season(data.fk_program_seasons) : null,
      location: data.location ? data.location[0] : { lat: null, lon: null }
    };
  }

  private teamOrderDict = {
    id: '_id',
    program: 'team_type',
    number: 'team_number_yearly',
    name: 'team_nickname',
    city: 'team_city',
    stateProv: 'team_stateprov',
    countryCode: 'team_country',
    rookieYear: 'team_rookieyear',
    website: 'team_web_url',
    profileYear: 'profile_year'
  };

  private convertEventDate(data: string): string {
    const tSplit: string[] = data.split('T');
    return tSplit[0];
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
      countryCode: data.event_country,
      stateProv: data.event_stateprov,
      dateStart: this.convertEventDate(data.date_start),
      dateEnd: this.convertEventDate(data.date_end),
      type: this.convertEventType(data.event_subtype),
      website: data.event_web_url,
      program: data.event_type,
      season: data.event_season,
      location: data.location ? data.location[0] : { lat: null, lon: null }
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
    program: 'event_type',
    season: 'event_season'
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
    const teamData = this.idGenerator.decodeTeam(id);
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
      return this.convertTeam(id, teamRaw);
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
    const eventData = this.idGenerator.decodeEvent(id);
    // Otherwise, query the server
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      query: {
        query_string: {
          query: `event_code: ${eventData.code} AND event_season: ${eventData.season}`
        }
      }
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) {
        return null;
      }
      const eventRaw = result.hits[0];
      return this.convertEvent(id, eventRaw);
    }).catch(() => {
      return null;
    });
  }

  private buildTeamQuery(filter: TeamFilter): any {
    const must = [];
    if (filter.profileYear) {
      must.push(this.elasticSearch.makeBool('profile_year', filter.profileYear));
    }
    if (filter.season) {
      const seasonIds: number[] = [];
      for (const season of filter.season) {
        seasonIds.push(this.idGenerator.decodeSeason(season).internalId);
      }
      must.push(this.elasticSearch.makeBool('fk_program_seasons', seasonIds));
    }
    if (filter.program) {
      must.push(this.elasticSearch.makeBool('team_type', filter.program));
    }
    if (filter.countryCode) {
      must.push(this.elasticSearch.makeBool('team_country', filter.countryCode));
    }
    if (filter.country) {
      const countryCodes: string[] = [];
      for (const country of filter.country) {
        countryCodes.push(this.idGenerator.decodeCountry(country).code);
      }
      must.push(this.elasticSearch.makeBool('team_country', countryCodes));
    }
    return {
      bool: {
        must
      }
    };
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
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.teamOrderDict, orderBy ? orderBy : []),
      query: this.buildTeamQuery(filter)
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

  private buildEventQuery(filter: EventFilter, dateRange?: DateRange): any {
    const must = [];
    if (filter.name) {
      must.push(this.elasticSearch.makeBool('event_name', filter.name));
    }
    if (filter.year) {
      must.push(this.elasticSearch.makeBool('event_season', filter.year));
    }
    if (filter.season) {
      const seasonIds: number[] = [];
      for (const season of filter.season) {
        seasonIds.push(this.idGenerator.decodeSeason(season).internalId);
      }
      must.push(this.elasticSearch.makeBool('fk_program_seasons', seasonIds));
    }
    if (filter.program) {
      must.push(this.elasticSearch.makeBool('event_type', filter.program));
    }
    if (filter.countryCode) {
      must.push(this.elasticSearch.makeBool('event_country', filter.countryCode));
    }
    if (filter.country) {
      const countryCodes: string[] = [];
      for (const country of filter.country) {
        countryCodes.push(this.idGenerator.decodeCountry(country).code);
      }
      must.push(this.elasticSearch.makeBool('event_country', countryCodes));
    }
    if (filter.stateProv) {
      must.push(this.elasticSearch.makeBool('event_stateprov', filter.stateProv));
    }
    if (dateRange) {
      must.push({
        range: {
          date_end: dateRange
        }
      });
    }
    return {
      bool: {
        must
      }
    };
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
    orderBy: EventOrder[] = [],
    dateRange?: DateRange
  ): Promise<FindResult<Event>> {
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.eventOrderDict, orderBy ? orderBy : []),
      query: this.buildEventQuery(filter, dateRange),
    }).then((result: ElasticResult) => {
      const converted = this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertEvent(
          this.idGenerator.event(
            nodeRaw.event_season,
            nodeRaw.event_code
          ),
          nodeRaw
        );
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

  public eventSearch(
    query: string,
    first: number,
    after?: string,
    filter: EventFilter = {},
    orderBy: EventOrder[] = [],
    dateRange?: DateRange
  ): Promise<FindResult<Event>> {
    const q = this.buildEventQuery(filter, dateRange);
    // Add the search terms
    q.bool.must.push({
      bool: {
        should: [
          {
            match: {
              event_name: query
            }
          }, {
            match: {
              event_code: query
            }
          }, {
            match: {
              event_venue: query
            }
          }, {
            match: {
              event_city: query
            }
          }, {
            match: {
              event_stateprov: query
            }
          }, {
            match: {
              event_country: query
            }
          }, {
            match: {
              event_city: query
            }
          }, {
            match: {
              event_stateprov: query
            }
          }, {
            match: {
              event_country: query
            }
          }
        ]
      }
    });
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.eventOrderDict, orderBy ? orderBy : []),
      query: q
    }).then((result: ElasticResult) => {
      const converted = this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertEvent(
          this.idGenerator.event(
            nodeRaw.event_season,
            nodeRaw.event_code
          ),
          nodeRaw
        );
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

  public teamSearch(
    query: string,
    first: number,
    after?: string,
    filter: TeamFilter = {},
    orderBy: TeamOrder[] = []
  ): Promise<FindResult<Team>> {
    const q = this.buildTeamQuery(filter);
    // Add the search terms
    q.bool.must.push({
      bool: {
        should: [
          {
            fuzzy: {
              team_nickname: query
            }
          }, {
            match: {
              team_nickname: query
            }
          }, {
            match: {
              team_city: query
            }
          }, {
            match: {
              team_country: query
            }
          }, {
            match: {
              team_stateprov: query
            }
          }
        ]
      }
    });
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.eventOrderDict, orderBy ? orderBy : []),
      query: q
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
   * Matches a TOA event to the official FIRST database
   * @param toaEvent The event returned by TOA
   */
  public async matchToaEvent(toaEvent: TOAEvent): Promise<Event> {
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      size: 1,
      query: this.buildEventQuery({
        year: [(toaEvent.season_key.substr(0, 2) as any * 1) + 2000],
        program: [Program.FTC],
        countryCode: [toaEvent.country],
        stateProv: [toaEvent.state_prov],
        name: [toaEvent.event_name]
      })
    }).then((result: ElasticResult) => {
      if (result.totalCount === 0) return null;
      const rawEvent = result.hits[0];
      return this.convertEvent(
        this.idGenerator.event(
          rawEvent.event_season,
          rawEvent.event_code
        ),
        rawEvent
      );
    });
  }

  public async findEventsByLocation(
    location: Location,
    distance: number,
    units: Units,
    first: number,
    after?: string,
    filter: EventFilter = {},
    orderBy: EventOrder[] = [],
    dateRange?: DateRange
  ): Promise<FindResult<Event>> {
    const q = this.buildEventQuery(filter, dateRange);
    return this.elasticSearch.query('https://es01.usfirst.org/events/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.eventOrderDict, orderBy ? orderBy : []),
      query: {
        filtered: {
          query: q
        }
      },
      filter: {
        geo_distance: {
          location,
          distance: distance.toString() + units.toString()
        }
      }
    }).then((result: ElasticResult) => {
      return this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertEvent(
          this.idGenerator.event(
            nodeRaw.event_season,
            nodeRaw.event_code
          ),
          nodeRaw
        );
      });
    });
  }

  public async findTeamsByLocation(
    location: Location,
    distance: number,
    units: Units,
    first: number,
    after?: string,
    filter: TeamFilter = {},
    orderBy: TeamOrder[] = []
  ): Promise<FindResult<Team>> {
    const q = this.buildTeamQuery(filter);
    return this.elasticSearch.query('https://es01.usfirst.org/teams/_search', {
      size: first + 1,
      from: after ? this.idGenerator.decodeCursor(after).from + 1 : 0,
      sort: this.elasticSearch.buildSort(this.teamOrderDict, orderBy ? orderBy : []),
      query: {
        filtered: {
          query: q
        }
      },
      filter: {
        geo_distance: {
          location,
          distance: distance.toString() + units.toString()
        }
      }
    }).then((result: ElasticResult) => {
      return this.convertAll(result, first, after, (nodeRaw) => {
        return this.convertTeam(
          this.idGenerator.team(
            nodeRaw.team_type,
            nodeRaw.team_number_yearly),
          nodeRaw
        );
      });
    });
  }

}
