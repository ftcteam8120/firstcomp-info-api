import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Event, EventFilter, EventOrder } from '../entity/Event';
import { FIRSTSearch, FindResult } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { DataMerge } from '../util/DataMerge';
import { Program } from '../entity/Team';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { RedisCache } from '../util/RedisCache';
import * as _ from 'lodash';
import { TheOrangeAlliance } from '../service/TheOrangeAlliance';

@Service()
export class EventRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private dataMerge: DataMerge,
    private theBlueAlliance: TheBlueAlliance,
    private theOrangeAlliance: TheOrangeAlliance,
    private redisCache: RedisCache
  ) { }

  /**
   * Find an event by ID
   * @param id The event ID
   */
  public async findById(id: string): Promise<Event> {
    // Check for a cached value
    // const cached = await this.redisCache.get<Event>(id);
    // if (cached) return cached;
    const decoded = this.idGenerator.decodeEvent(id);
    let event = this.dataMerge.mergeOne<Event>(
      await this.theOrangeAlliance.findEvent(id),
      await this.theBlueAlliance.findEvent(id),
      await this.firstSearch.findEvent(id),
      await this.entityManager.findOne(Event, decoded)
    );
    
    if (event) {
      // Inject extra data from TOA if it a FTC event
      if (event.program === Program.FTC) {
        event = await this.theOrangeAlliance.injectToaData(event);
      }
      // Cache the event
      await this.redisCache.set(event);
    }
    return event;
  }
  
  /**
   * Find an event by code
   * @param year The event year
   * @param code The event code
   */
  public async findByCode(year: number, code: string): Promise<Event> {
    return this.findById(this.idGenerator.event(year, code));
  }

  /**
   * Find all events
   * @param first How many events to find
   * @param after A cursor to find events after
   * @param filter An object containing filters
   * @param orderBy An array of EventOrder enums
   */
  public async find(first: number, after?: string, filter?: EventFilter, orderBy?: EventOrder[]):
    Promise<FindResult<Event>> {
    return this.dataMerge.mergeMany<Event>(
      Event,
      await this.firstSearch.findEvents(first, after, filter, orderBy),
      ['code']
    );
  }

  /**
   * Query all events
   * @param query A query string
   * @param first How many events to find
   * @param after A cursor to find events after
   * @param filter An object containing filters
   * @param orderBy An array of EventOrder enums
   */
  public async query(
    query: string,
    first: number,
    after?: string,
    filter?: EventFilter,
    orderBy?: EventOrder[]
  ): Promise<FindResult<Event>> {
    return this.dataMerge.mergeMany<Event>(
      Event,
      await this.firstSearch.eventSearch(query, first, after, filter, orderBy),
      ['code']
    );
  }

  /**
   * Find divisions for an event
   * @param divisionIds The IDs of the divisions to find
   * @param first How many divisions to find
   * @param after A cursor to find divisions after
   * @param filter An object containing filters
   * @param orderBy An array of EventOrder enums
   */
  public async findDivisions(
    event: Event,
    first: number,
    after?: string,
    filter?: EventFilter,
    orderBy?: EventOrder[]
  ): Promise<FindResult<Event>> {
    let divisions: Event[] = [];
    // Decode the cursor
    let from = 0;
    if (after) from = this.idGenerator.decodeCursor(after).from + 1;
    // Limit the count to how many were requested
    let limit;
    if (event.program === Program.FTC) {
      divisions = await this.theOrangeAlliance.findDivisions(event);
      limit = divisions.length;
    } else if (event.program === Program.FRC) {
      limit = event.divisions.length;
      // Query all of the divisions
      for (let i = from; i < limit; i += 1) {
        divisions.push(await this.theBlueAlliance.findEvent(event.divisions[i]));
      }
    }
    if (first < limit - from) {
      limit = first;
    }
    if (filter) {
      // Filter the objects first
      divisions = _.filter(divisions, filter as any);
    }
    if (orderBy) {
      // Get the orders from the orderBy arg
      const orderFields: string[] = [];
      const orders: string[] = [];
      let split: string[];
      for (const order of orderBy) {
        split = (order as string).split('_');
        orderFields.push(split[0]);
        orders.push(split[1].toLowerCase());
      }
      // Order last
      divisions = _.orderBy(divisions, orderFields, orders);
    }
    return {
      totalCount: divisions.length,
      hasNextPage: first < limit - from,
      hasPreviousPage: from > 0,
      data: divisions
    };
  }

}
