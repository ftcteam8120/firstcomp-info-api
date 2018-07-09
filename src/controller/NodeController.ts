import { Controller, Query } from 'vesper';
import { EventRepository } from '../repository/EventRepository';
import { TeamRepository } from '../repository/TeamRepository';
import { IDGenerator } from '../util/IDGenerator';
import { EntityManager } from 'typeorm';
import { User } from '../entity/User';

@Controller()
export class NodeController {

  constructor(
    private entityManager: EntityManager,
    private eventRepository: EventRepository,
    private teamRepository: TeamRepository,
    private idGenerator: IDGenerator
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
        // Otherwise, it is a user UUID
        return this.entityManager.findOne(User, id);
      }
      default: {
        throw new Error('Invalid ID format');
      }
    }
  }

}
