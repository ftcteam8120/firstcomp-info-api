import { Service, Container } from 'typedi';
import { getManager } from 'typeorm';
import { Role } from '../entity/Role';
import { RedisCache } from '../util/RedisCache';
import * as _ from 'lodash';

import { ScopeAction, SCOPES, ROLES } from './Scopes';

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
    // Check if the role is locally defined
    const local: Role = _.find(ROLES, { name });
    if (local) return Promise.resolve(local);
    // Check for a cached value
    const cached: any = await Container.get(RedisCache).get('Role-' + name);
    if (cached) return cached;
    // Find the role in the DB
    return getManager().findOne(Role, { name }).then((role: Role) => {
      // Cache the role in Redis
      return Container.get(RedisCache).setKey('Role-' + role.name, role).then(() => {
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
