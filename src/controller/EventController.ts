import { Controller, Query } from 'vesper';
import { EntityManager } from 'typeorm';
import { EventRepository } from '../repository/EventRepository';

@Controller()
export class EventController {

  constructor(
    private eventRepository: EventRepository
  ) { }

  @Query()
  event({ code }) {
    return this.eventRepository.findByCode(code);
  }

}
