import { Entity, Column, PrimaryColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Program } from './Team';
import { Match } from './Match';
import { User } from './User';

export enum EventType {
  KICKOFF = 'Kickoff',
  WORKSHOP = 'Workshop',
  SCRIMMAGE = 'Scrimmage',
  INTERVIEW_ONLY = 'InterviewOnly',
  MEET = 'Meet',
  QUALIFYING_EVENT = 'QualifyingEvent',
  _2ND_TIER_QUALIFYING_EVENT = '2ndTierQualifyingEvent',
  SUPER_REGIONAL = 'SuperRegional',
  REGIONAL = 'Regional',
  DISTRICT_EVENT = 'DistrictEvent',
  DISTRICT_CHAMPIONSHIP = 'DistrictChampionship',
  DISTRICT_CHAMPIONSHIP_WITH_LEVELS = 'DistrictChampionshipWithLevels',
  DISTRICT_CHAMPIONSHIP_DIVISION = 'DistrictChampionshipDivision',
  CHAMPIONSHIP_SUBDIVISION = 'ChampionshipSubdivision',
  CHAMPIONSHIP_DIVISION = 'ChampionshipDivision',
  CHAMPIONSHIP = 'Championship',
  WORLD_FESTIVAL = 'WorldFestival',
  OFF_SEASON = 'OffSeason',
  OFF_SEASON_WITH_AZURE_SYNC = 'OffSeasonWithAzureSync'
}

@Entity()
export class Event {

  @PrimaryColumn()
  code: string;

  @ManyToMany(type => User)
  @JoinTable()
  admins: User[];

  @Column({ nullable: true })
  address: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  venue: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  stateProv: string;

  @Column({ type: 'date', nullable: true })
  dateStart: Date;

  @Column({ type: 'date', nullable: true })
  dateEnd: Date;

  @Column({ enum: EventType, nullable: true })
  type: EventType;

  @Column({ nullable: true })
  website: string;

  @Column({ enum: Program, nullable: true })
  program: Program;

  @OneToMany(type => Match, match => match.event)
  matches: Match[];

}
