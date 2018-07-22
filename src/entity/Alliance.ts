import { Entity, Column, PrimaryColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { Event } from './Event';
import { Team, Program } from './Team';

@Entity()
export class Alliance {

  @PrimaryColumn({ type: 'varchar', name: 'eventCode' })
  @ManyToOne(type => Event, event => event.alliances)
  event?: Event | string;

  @PrimaryColumn({ type: 'int', name: 'eventSeason' })
  eventSeason?: number;

  @PrimaryColumn()
  number: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'int' })
  captain: Team | number;

  @Column({ array: true, nullable: true, type: 'int' })
  picks: Team[] | number[];

  @Column({ nullable: true, type: 'int' })
  backup: Team | number;

  @Column({ nullable: true, type: 'int' })
  backupReplaced: Team | number;

}
