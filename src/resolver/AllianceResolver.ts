import { Resolver, Resolve } from 'vesper';
import { Alliance } from '../entity/Alliance';
import { Event } from '../entity/Event';
import { TeamRepository } from '../repository/TeamRepository';

@Resolver(Alliance)
export class AllianceResolver {

  constructor(
    private teamRepository: TeamRepository
  ) { }

  @Resolve()
  captain(alliance: Alliance) {
    if (!alliance.captain) return null;
    return this.teamRepository.findByNumber(
      (alliance.event as Event).program,
      alliance.captain as number
    );
  }

  @Resolve()
  round1(alliance: Alliance) {
    if (!alliance.round1) return null;
    return this.teamRepository.findByNumber(
      (alliance.event as Event).program,
      alliance.round1 as number
    );
  }

  @Resolve()
  round2(alliance: Alliance) {
    if (!alliance.round2) return null;
    return this.teamRepository.findByNumber(
      (alliance.event as Event).program,
      alliance.round2 as number
    );
  }

  @Resolve()
  round3(alliance: Alliance) {
    if (!alliance.round3) return null;
    return this.teamRepository.findByNumber(
      (alliance.event as Event).program,
      alliance.round3 as number
    );
  }

  @Resolve()
  backup(alliance: Alliance) {
    if (!alliance.backup) return null;
    return this.teamRepository.findByNumber(
      (alliance.event as Event).program,
      alliance.backup as number
    );
  }

  @Resolve()
  backupReplaced(alliance: Alliance) {
    if (!alliance.backupReplaced) return null;
    return this.teamRepository.findByNumber(
      (alliance.event as Event).program,
      alliance.backupReplaced as number
    );
  }

}
