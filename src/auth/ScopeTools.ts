import { Service, Container } from 'typedi';
import { getManager } from 'typeorm';
import { Role } from '../entity/Role';
import { RedisCache } from '../util/RedisCache';
import * as _ from 'lodash';

export enum ScopeAction {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export interface Scope {
  entity: string;
  actions: ScopeAction[];
  fields: string[];
}

export const SCOPES: Scope[] = [
  {
    entity: 'event',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE,
      ScopeAction.ADMIN
    ],
    fields: [
      'address',
      'name',
      'description',
      'venue',
      'city',
      'countryCode',
      'stateProv',
      'dateStart',
      'dateEnd',
      'type',
      'website',
      'matches',
      'alliances',
      'awards',
      'year'
    ]
  },
  {
    entity: 'match',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'actualStartTime',
      'description',
      'postResultTime',
      'scoreRedTeleop',
      'scoreRedFoul',
      'scoreRedAuto',
      'scoreRedAutoBonus',
      'scoreRedEnd',
      'scoreBlueTeleop',
      'scoreBlueFoul',
      'scoreBlueAuto',
      'scoreBlueAutoBonus',
      'scoreBlueEnd',
      'details',
      'teams'
    ]
  },
  {
    entity: 'team',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'homeCmp',
      'name',
      'sponsors',
      'city',
      'stateProv',
      'countryCode',
      'rookieYear',
      'robotName',
      'districtCode',
      'website',
      'season',
      'profileYear'
    ]
  },
  {
    entity: 'user',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE,
      ScopeAction.ADMIN
    ],
    fields: [
      'firstName',
      'lastName',
      'email',
      'photoUrl',
      'password'
    ]
  },
  {
    entity: 'alliance',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'name',
      'captain',
      'round1',
      'round2',
      'round3',
      'backup',
      'backupReplaced'
    ]
  },
  {
    entity: 'award',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'team',
      'person',
      'name'
    ]
  },
  {
    entity: 'ranking',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'rank',
      'dq',
      'matchesPlayed',
      'losses',
      'wins',
      'team'
    ]
  }
];

@Service()
export class ScopeTools {

  /**
   * Finds a Role by name
   *
   * @param {string} name The name of the role
   * @returns {Promise<Role>}
   * @memberof ScopeTools
   */
  public async findRole(name: string): Promise<Role> {
    // Check for a cached value
    const cached: any = await Container.get(RedisCache).get('Role-' + name);
    if (cached) return cached;
    // Find the role in the DB
    return getManager().findOne(Role, { name }).then((role: Role) => {
      // Set the ID of the role
      role.id = 'Role-' + name;
      // Cache the role in Redis
      return Container.get(RedisCache).set(role).then(() => {
        return role;
      });
    });
  }

  /**
   * Splits a scope string into its basic parts
   *
   * @param {string} scope The scope
   * @returns {{ entity: string, actions: ScopeAction[], fields: string[] }}
   * @memberof ScopeTools
   */
  public splitScope(
    scope: string
  ): { entity: string, actions: ScopeAction[], fields: string[] } {
    // Split the scope into a prefix and suffix
    const split: string[] = scope.split(':');
    const prefix = split[0];
    const suffix = split[1];
    // Find the entity name as the first part of the prefix
    const entity: string = prefix.split('.')[0];
    // Split the suffix into actions
    const actions: ScopeAction[] = suffix.split(',') as ScopeAction[];
    // If there is a second part of the prefix, then split it into fields
    const fields: string[] = prefix.split('.')[1] ? prefix.split('.')[1].split(',') : [];
    return {
      entity,
      actions,
      fields
    };
  }
  
  /**
   * Verifies that a given scope is valid
   *
   * @param {string} scope The scope
   * @returns {Promise<Scope>}
   * @memberof ScopeTools
   */
  public verifyScope(scope: string): boolean {
    const split = this.splitScope(scope);
    const foundScope = _.find(SCOPES, { entity: split.entity });
    // Return false if the entity does not exist
    if (!foundScope) return false;
    // Make sure that all the actions are valid
    for (const action of split.actions) {
      if (!foundScope.actions.includes(action)) return false;
    }
    // Make sure that all the field names are valid
    for (const field of split.fields) {
      if (!foundScope.fields.includes(field)) return false;
    }
    // Otherwise, return ture
    return true;
  }

}
