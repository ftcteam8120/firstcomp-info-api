import { Service } from 'typedi';
import { EntityManager } from 'typeorm';
import { FIRSTSearch, FindResult } from '../service/FIRSTSearch';
import { IDGenerator } from '../util/IDGenerator';
import { DataMerge } from '../util/DataMerge';
import { SeasonOrder, SeasonFilter, Season } from '../entity/Season';
import { Program } from '../entity/Team';

@Service()
export class SeasonRepository {
  constructor(
    private firstSearch: FIRSTSearch,
    private dataMerge: DataMerge
  ) { }

  public async findById(id: string): Promise<Season> {
    return this.firstSearch.findSeason(id);
  }

  public async findByYear(program: Program, year: number) {
    return this.firstSearch.findSeasonByYear(program, year);
  }

  public async find(first: number, after?: string, filter?: SeasonFilter, orderBy?: SeasonOrder[]):
    Promise<FindResult<Season>> { 
    return this.dataMerge.mergeMany<Season>(
      Season,
      await this.firstSearch.findSeasons(first, after, filter, orderBy),
      ['program', 'startYear']
    );
  }
}
