import { Controller, Query, Authorized } from 'vesper';
import { MatchRepository } from '../repository/MatchRepository';

@Controller()
export class MatchController {

  constructor(
    private matchRepository: MatchRepository
  ) { }

  @Query()
  @Authorized(['match:read'])
  async match({ id }) {
    return this.matchRepository.findById(id);
  }

}
