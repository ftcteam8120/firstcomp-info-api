import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Team, Program, TeamFilter, TeamOrder } from '../entity/Team';
import { FIRSTSearch, FindResult } from '../service/FIRSTSearch';
import * as _ from 'lodash';
import { IDGenerator } from '../util/IDGenerator';

@Service()
export class TeamRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator
  ) { }

  /**
   * Find a team by ID
   * @param id The team ID
   */
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
  
  /**
   * Find a team by number
   * @param program The program code
   * @param number The team number
   */
  public async findByNumber(program: Program, number: number): Promise<Team> {
    return this.findById(this.idGenerator.team(program, number));
  }

  /**
   * Find all teams
   * @param first How many teams to find
   * @param after A curstor to find teams after
   * @param filter An object containing filters
   * @param orderBy An array of TeamOrder enums
   */
  public async find(first: number, after?: string, filter?: TeamFilter, orderBy?: TeamOrder[]):
    Promise<FindResult<Team>> {
    return this.firstSearch.findTeams(first, after, filter, orderBy);
  }

}
