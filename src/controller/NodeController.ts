import { Controller, Query } from 'vesper';
import { EventRepository } from '../repository/EventRepository';
import { TeamRepository } from '../repository/TeamRepository';
import { IDGenerator } from '../util/IDGenerator';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { EntityManager } from 'typeorm';
import { User } from '../entity/User';

@Controller()
export class NodeController {

  constructor(
    private entityManager: EntityManager,
    private eventRepository: EventRepository,
    private teamRepository: TeamRepository,
    private idGenerator: IDGenerator,
    private firstSearch: FIRSTSearch
  ) { }

  @Query()
  node({ id }) {
    // Check the type of the requested node
    switch (this.idGenerator.getNodeType(id)) {
      case 'Team': {
        return this.teamRepository.findById(id);
      }
      case 'Event': {
        return this.eventRepository.findById(id);
      }
      case 'User': {
        return this.entityManager.findOne(User, id);
      }
      case 'Season': {
        return this.firstSearch.findSeason(id);
      }
      case 'Country': {
        return this.firstSearch.findCountry(id);
      }
      default: {
        throw new Error('Invalid ID format');
      }
    }
  }

}
