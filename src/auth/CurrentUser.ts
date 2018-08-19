import { User } from '../entity/User';
import { Container } from 'typedi';
import { ScopeTools } from './ScopeTools';
import { Scope, SCOPES } from './Scopes';
import * as _ from 'lodash';

export class CurrentUser {

  public id?: string;
  public profile?: User;
  public scopes?: Scope[];
  public expires: number;

  constructor(user: User, scopes: string[], expires: number) {
    if (user) {
      this.id = user.id;
      this.profile = user;
    }
    this.expires = expires;
    this.scopes = [];
    if (scopes) {
      for (const scope of scopes) {
        this.scopes.push(Container.get(ScopeTools).splitScope(scope));
      }
    }
  }

  public hasScopes(scopes: string[]): boolean {
    for (const scope of scopes) {
      if (!this.hasScope(scope)) return false;
    }
    return true;
  }

  public hasScope(scope: string): boolean {
    // Split the required scope into its parts
    const required = Container.get(ScopeTools).splitScope(scope);
    // Make sure the user has been granted the base scope
    const foundScope = _.find(this.scopes, { entity: required.entity });
    if (!foundScope) return false;
    // Make sure the user has all the required actions
    for (const action of required.actions) {
      if (!foundScope.actions.includes(action)) return false;
    }
    // If the found scope does not have any specified fields, it encompasses all required fields
    if (foundScope.fields.length === 0) return true;
    // If the required scope has one or more fields and the found scope also has or or more
    if (required.fields.length > 0) {
      // Then, make sure that the found scope has all the required fields
      for (const field of required.fields) {
        if (!foundScope.fields.includes(field)) return false;
      }
    }
    // If required scope has no specified fields and the found scope has fields
    // Load the default scope from the array
    const defaultScope = _.find(SCOPES, { entity: required.entity });
    // Make sure that the found scope has ALL of the fields of the default scope
    for (const field of defaultScope.fields) {
      if (!foundScope.fields.includes(field)) return false;
    }
    // Otherwise, return true
    return true;
  }

}
