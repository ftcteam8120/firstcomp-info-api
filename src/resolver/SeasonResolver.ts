import { Resolver, Resolve, Authorized } from 'vesper';
import { Season } from '../entity/Season';
import { EntityManager } from 'typeorm';
import { Article } from '../entity/Article';

@Resolver(Season)
export class SeasonResolver {

  constructor(
    private entityManager: EntityManager
  ) { }

  @Resolve()
  @Authorized(['article:read'])
  article(season: Season) {
    return this.entityManager.findOne(Article, { id: season.article as string });
  }

}
