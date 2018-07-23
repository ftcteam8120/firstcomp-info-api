import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Event, EventFilter, EventOrder } from '../entity/Event';
import { FIRSTSearch, FindResult } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { DataMerge } from '../util/DataMerge';
import { Program } from '../entity/Team';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { RedisCache } from '../util/RedisCache';

@Service()
export class EventRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private dataMerge: DataMerge,
    private theBlueAlliance: TheBlueAlliance,
    private redisCache: RedisCache
  ) { }

  /**
   * Find an event by ID
   * @param id The event ID
   */
  public async findById(id: string): Promise<Event> {
    // Check for a cached value
    const cached = await this.redisCache.get<Event>(id);
    if (cached) return cached;
    const decoded = this.idGenerator.decodeEvent(id);
    const event = this.dataMerge.mergeOne<Event>(
      await this.theBlueAlliance.findEvent(id),
      await this.firstSearch.findEvent(id),
      await this.entityManager.findOne(Event, decoded)
    );
    // Cache the event
    if (event) await this.redisCache.set(event);
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
   * @param after A curstor to find events after
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

}
