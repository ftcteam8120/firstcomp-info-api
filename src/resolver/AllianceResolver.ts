import { Resolver, Resolve } from 'vesper';
import { Alliance } from '../entity/Alliance';
import { Event } from '../entity/Event';
import { TeamRepository } from '../repository/TeamRepository';
import { Team } from '../entity/Team';

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
  async picks(alliance: Alliance) {
    if (!alliance.picks) return [];
    const picks: Team[] = [];
    for (const number of picks as any[]) {
      picks.push(
        await this.teamRepository.findByNumber(
          (alliance.event as Event).program,
          number as number
        )
      );
    }
    return picks;
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
