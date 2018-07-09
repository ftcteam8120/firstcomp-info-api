import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Team, Program } from '../entity/Team';
import { FIRSTSearch } from '../service/FIRSTSearch';
import * as _ from 'lodash';
import { IDGenerator } from '../util/IDGenerator';

@Service()
export class TeamRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) { }

  public async findById(id: string): Promise<Team> {
    const firstData = await this.firstSearch.findTeam(id);
    const teamData = this.idGenerator.decodeTeam(id);
    const localData = await this.entityManager.findOne(Team, {
      program: teamData.program,
      number: teamData.number.toString()
    });
    if (firstData === null && localData === undefined) return null;
    return _.mergeWith(
      {},
      firstData,
      localData,
      (a, b) => b === null ? a : undefined
    );
  }
  
  public async findByNumber(program: Program, number: number): Promise<Team> {
    return this.findById(this.idGenerator.team(program, number));
  }

}
