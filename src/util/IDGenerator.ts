import { Service } from 'typedi';
import { Program } from '../entity/Team';
import * as validate from 'uuid-validate';

@Service()
export class IDGenerator {

  public atob(a: string): string {
    return new Buffer(a, 'base64').toString('binary');
  }
  
  public btoa(b: string): string {
    return new Buffer(b).toString('base64');
  }

  public getNodeType(id: string): string {
    // If it is a valid UUID, it is a user
    if (validate(id)) return 'User';
    // Otherwise, try to decode the base64 ID
    return this.atob(id).split('-')[0];
  }

  public team(program: Program, number: number): string {
    return this.btoa('Team-' + program.toString() + '-' + number.toString());
  }

  public decodeTeam(id: string): { program: Program, number: number } {
    const split: any[] = this.atob(id).split('-');
    if (split[0] !== 'Team') throw new Error('Invalid Team ID');
    return {
      program: Program[split[1]] as Program,
      number: split[2] as number
    };
  }

  public event(code: string): string {
    return this.btoa('Event-' + code);
  }

  public decodeEvent(id: string): { code: string } {
    const split: any[] = this.atob(id).split('-');
    if (split[0] !== 'Event') throw new Error('Invalid Event ID');
    return {
      code: split[1]
    };
  }

  public season(internalId: number) {
    return this.btoa('Season-' + internalId.toString());
  }

  public decodeSeason(id: string): { internalId: number } {
    const split: any[] = this.atob(id).split('-');
    if (split[0] !== 'Season') throw new Error('Invalid Season ID');
    return {
      internalId: split[1]
    };
  }

  public country(code: string) {
    return this.btoa('Country-' + code);
  }

  public decodeCountry(id: string): { code: string } {
    const split: any[] = this.atob(id).split('-');
    if (split[0] !== 'Country') throw new Error('Invalid Country ID');
    return {
      code: split[1]
    };
  }

  /**
   * Makes a cursor for a node
   * @param id The ID of the record
   * @param from The position of the node
   */
  public makeCursor(id: string, from: number) {
    return this.btoa('C-' + id + '-' + from.toString());
  }

  /**
   * Decodes a cursor
   * @param cursor The cursor to decode
   */
  public decodeCursor(cursor: string): { id: string, from: number } {
    const split: any[] = this.atob(cursor).split('-');
    if (split[0] !== 'C') throw new Error('Invalid cursor');
    return {
      id: split[1],
      from: split[2] * 1
    };
  }
  
}
