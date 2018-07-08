import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Event } from '../entity/Event';
import { FIRSTSearch } from '../service/FIRSTSearch';
import * as _ from 'lodash';

@Service()
export class EventRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch
  ) { }
  
  public async findByCode(code: string): Promise<Event> {
    const firstData = await this.firstSearch.findEvent(code);
    const localData = await this.entityManager.findOne(Event, { code });
    if (firstData === null && localData === undefined) return null;
    return _.mergeWith(
      {},
      firstData,
      localData,
      (a, b) => b === null ? a : undefined
    );
  }

}
