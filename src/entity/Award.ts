import { Entity, PrimaryColumn, ManyToOne, Column } from 'typeorm';
import { Event } from './Event';
import { Team } from './Team';

@Entity()
export class Award {
  
  @PrimaryColumn({ type: 'int' })
  awardId: number;
  
  @PrimaryColumn({ type: 'varchar', name: 'eventCode' })
  @ManyToOne(type => Event, event => event.awards)
  event: Event | string;

  @PrimaryColumn({ type: 'int', name: 'eventSeason' })
  eventSeason: number;

  @PrimaryColumn({ type: 'int' })
  series: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'int' })
  team?: Team | number;

  @Column({ nullable: true })
  person?: string;

}
