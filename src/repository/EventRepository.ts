import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Event } from '../entity/Event';
import { FIRSTSearch } from '../service/FIRSTSearch';
import * as _ from 'lodash';
import { IDGenerator } from '../util/IDGenerator';

@Service()
export class EventRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) { }

  public async findById(id: string): Promise<Event> {
    const firstData = await this.firstSearch.findEvent(id);
    const eventData = this.idGenerator.decodeEvent(id);
    const localData = await this.entityManager.findOne(Event, { code: eventData.code });
    if (firstData === null && localData === undefined) return null;
    return _.mergeWith(
      {},
      firstData,
      localData,
      (a, b) => b === null ? a : undefined
    );
  }
  
  public async findByCode(code: string): Promise<Event> {
    return this.findById(this.idGenerator.event(code));
  }

}
