import { Controller, Query, Authorized } from 'vesper';
import { EntityManager } from 'typeorm';
import { TheBlueAlliance } from '../service/TheBlueAlliance';
import { IDGenerator } from '../util/IDGenerator';
import { Match } from '../entity/Match';

@Controller()
export class MatchController {

  constructor(
    private entityManager: EntityManager,
    private theBlueAlliance: TheBlueAlliance,
    private idGenerator: IDGenerator
  ) { }

  @Query()
  async match({ id }) {
    const decoded = this.idGenerator.decodeMatch(id);
    const match = await this.entityManager.findOne(Match, {
      number: decoded.number,
      setNumber: decoded.setNumber,
      level: decoded.level,
      event: decoded.eventCode,
      eventSeason: decoded.eventSeason
    });
    if (!match) return this.theBlueAlliance.findMatch(id);
  }

}
