import { Entity, PrimaryColumn, ManyToOne, Column } from 'typeorm';
import { Event } from './Event';
import { Team } from './Team';
import { Award, AwardType } from './Award';

@Entity()
export class AwardRecipient {
  
  @PrimaryColumn({ enum: AwardType, type: 'varchar', name: 'awardType' })
  @ManyToOne(type => Award, award => award.recipients)
  award?: AwardType | Award;
  
  @PrimaryColumn({ type: 'varchar', name: 'awardEvent' })
  awardEvent?: string;

  @PrimaryColumn({ type: 'int', name: 'awardEventSeason' })
  awardEventSeason?: number;

  @Column({ nullable: true, type: 'int' })
  team?: Team | number;

  @Column({ nullable: true, type: 'varchar' })
  person?: string;

}
