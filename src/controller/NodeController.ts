import { Controller, Query, Authorized, RoleCheckerInterface, Action } from 'vesper';
import { EventRepository } from '../repository/EventRepository';
import { TeamRepository } from '../repository/TeamRepository';
import { IDGenerator } from '../util/IDGenerator';
import { FIRSTSearch } from '../service/FIRSTSearch';
import { EntityManager } from 'typeorm';
import { User } from '../entity/User';
import { CurrentUser } from '../auth/CurrentUser';
import { MatchRepository } from '../repository/MatchRepository';

class NodeAuthorizationChecker implements RoleCheckerInterface {
  public check(action: Action) {
    // Get the ID from the arguments
    const id = action.args.id;
    // Get the current user from the container
    const currentUser = action.container.get(CurrentUser);
    // Make sure that the current user has all required scopes
    switch (action.container.get(IDGenerator).getNodeType(id)) {
      case 'Team': {
        if (!currentUser.hasScope('team:read')) {
          throw new Error('Missing required scopes team:read');
        }
        break;
      }
      case 'Event': {
        if (!currentUser.hasScope('event:read')) {
          throw new Error('Missing required scopes event:read');
        }
        break;
      }
      case 'User': {
        if (!currentUser.hasScope('user:read')) {
          throw new Error('Missing required scopes user:read');
        }
        break;
      }
      case 'Season': {
        if (!currentUser.hasScope('season:read')) {
          throw new Error('Missing required scopes season:read');
        }
        break;
      }
      case 'Country': {
        if (!currentUser.hasScope('country:read')) {
          throw new Error('Missing required scopes country:read');
        }
        break;
      }
      case 'Match': {
        if (!currentUser.hasScope('match:read')) {
          throw new Error('Missing required scopes match:read');
        }
        break;
      }
      default: {
        throw new Error('Invalid ID format');
      }
    }
  }
}

@Controller()
export class NodeController {

  constructor(
    private entityManager: EntityManager,
    private eventRepository: EventRepository,
    private teamRepository: TeamRepository,
    private matchRepository: MatchRepository,
    private idGenerator: IDGenerator,
    private firstSearch: FIRSTSearch
  ) { }

  @Query()
  @Authorized(NodeAuthorizationChecker)
  node({ id }) {
    // Check the type of the requested node
    switch (this.idGenerator.getNodeType(id)) {
      case 'Team': {
        return this.teamRepository.findById(id);
      }
      case 'Event': {
        return this.eventRepository.findById(id);
      }
      case 'User': {
        return this.entityManager.findOne(User, id);
      }
      case 'Season': {
        return this.firstSearch.findSeason(id);
      }
      case 'Country': {
        return this.firstSearch.findCountry(id);
      }
      case 'Match': {
        return this.matchRepository.findById(id);
      }
      default: {
        throw new Error('Invalid ID format');
      }
    }
  }

}
