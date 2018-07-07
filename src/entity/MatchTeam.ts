import { Entity, Column, PrimaryColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Match } from './Match';
import { Team } from './Team';

export enum Station {
  BLUE1 = 'Blue1',
  BLUE2 = 'Blue2',
  BLUE3 = 'Blue3',
  RED1 = 'Red1',
  RED2 = 'Red2',
  RED3 = 'Red3'
}

@Entity()
export class MatchTeam {

  @PrimaryColumn({ type: 'varchar' })
  @ManyToOne(type => Match, match => match.teams)
  match: Match;

  @PrimaryColumn({ type: 'varchar' })
  @OneToOne(type => Team)
  @JoinColumn()
  team: Team;

  @Column({ enum: Station })
  station: Station;

  @Column({ nullable: true })
  dq: boolean;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ nullable: true })
  surrogate: boolean;

}
