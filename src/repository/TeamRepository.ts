import { EntityManager } from 'typeorm';
import { Service } from 'typedi';
import { Team, Program, TeamFilter, TeamOrder } from '../entity/Team';
import { FIRSTSearch, FindResult, Units } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { DataMerge } from '../util/DataMerge';
import { RedisCache } from '../util/RedisCache';
import { Location } from 'graphql';

@Service()
export class TeamRepository {

  constructor(
    private entityManager: EntityManager,
    private firstSearch: FIRSTSearch,
    private idGenerator: IDGenerator,
    private dataMerge: DataMerge,
    private redisCache: RedisCache
  ) { }

  /**
   * Find a team by ID
   * @param id The team ID
   */
  public async findById(id: string): Promise<Team> {
    // Check for a cached value
    const cached = await this.redisCache.get<Team>(id);
    if (cached) return cached;
    const teamData = this.idGenerator.decodeTeam(id);
    const team = this.dataMerge.mergeOne<Team>(
      await this.firstSearch.findTeam(id),
      await this.entityManager.findOne(Team, {
        program: teamData.program,
        number: teamData.number
      })
    );
    // Cache the team
    if (team) await this.redisCache.set(team);
    return team;
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
      await this.firstSearch.findTeams(first, after, filter, orderBy),
      ['program', 'number']
    );
  }

  /**
   * Query all teams
   * @param query A query string
   * @param first How many teams to find
   * @param after A cursor to find teams after
   * @param filter An object containing filters
   * @param orderBy An array of TeamOrder enums
   */
  public async query(
    query: string,
    first: number,
    after?: string,
    filter?: TeamFilter,
    orderBy?: TeamOrder[]
  ): Promise<FindResult<Team>> {
    return this.dataMerge.mergeMany<Team>(
      Team,
      await this.firstSearch.teamSearch(query, first, after, filter, orderBy),
      ['program', 'number']
    );
  }

  public async findByLocation(
    location: Location,
    distance: number,
    units: Units,
    first: number,
    after?: string,
    filter: TeamFilter = {},
    orderBy: TeamOrder[] = []
  ): Promise<FindResult<Team>> {
    return this.dataMerge.mergeMany<Team>(
      Team,
      await this.firstSearch.findTeamsByLocation(
        location,
        distance,
        units,
        first,
        after,
        filter,
        orderBy
      ),
      ['program', 'number']
    );
  }
}
