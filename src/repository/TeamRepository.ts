import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Team, Program, TeamFilter, TeamOrder } from '../entity/Team';
import { FIRSTSearch, FindResult } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { DataMerge } from '../util/DataMerge';

@Service()
export class TeamRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private dataMerge: DataMerge
  ) { }

  /**
   * Find a team by ID
   * @param id The team ID
   */
  public async findById(id: string): Promise<Team> {
    const teamData = this.idGenerator.decodeTeam(id);
    return this.dataMerge.mergeOne<Team>(
      await this.firstSearch.findTeam(id),
      await this.entityManager.findOne(Team, {
        program: teamData.program,
        number: teamData.number.toString()
      })
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
    return this.dataMerge.mergeMany<Team>(
      Team,
      await this.firstSearch.findTeams(first, after, filter, orderBy)
    );
  }

}
