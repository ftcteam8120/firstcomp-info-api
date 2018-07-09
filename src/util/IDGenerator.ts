import { Service } from 'typedi';
import { Program } from '../entity/Team';
import * as validate from 'uuid-validate';

@Service()
export class IDGenerator {

  private atob(a: string): string {
    return new Buffer(a, 'base64').toString('binary');
  }
  
  private btoa(b: string): string {
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
    return {
      program: Program[split[1]] as Program,
      number: split[2] as number
    };
  }

  public event(code: string): string {
    return this.btoa('Event-' + code);
  }

  public decodeEvent(id: string): { code: string } {
    return {
      code: this.atob(id).split('-')[1]
    };
  }
  
}
