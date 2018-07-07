import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany } from 'typeorm';
import { Event } from './Event';

@Entity()
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  /**
   * The OAuth2 provider
   */
  @Column({ nullable: true })
  provider?: string;

  /**
   * The OAuth2 provider identifier
   */
  @Column({ nullable: true })
  providerId?: string;

  /**
   * An OAuth2 refresh token
   */
  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @CreateDateColumn()
  created: Date;
  
  @ManyToMany(type => Event, event => event.admins)
  events: Event[];

}
