import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Team, Program } from '../entity/Team';
import { FIRSTSearch } from '../service/FIRSTSearch';
import * as _ from 'lodash';

@Service()
export class TeamRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch
  ) { }
  
  public async findByNumber(program: Program, number: number): Promise<Team> {
    const firstData = await this.firstSearch.findTeam(program, number);
    const localData = await this.entityManager.findOne(Team, {
      program,
      number: number.toString()
    });
    if (firstData === null && localData === undefined) return null;
    return _.mergeWith(
      {},
      firstData,
      localData,
      (a, b) => b === null ? a : undefined
    );
  }

}
