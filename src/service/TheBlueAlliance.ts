import { Service } from 'typedi';
import { TBA_KEY, TBA_URL } from '../';
import { IDGenerator } from '../util/IDGenerator';
import { RedisCache } from '../util/RedisCache';
import fetch from 'node-fetch';
import { Event, EventType, PlayoffType } from '../entity/Event';
import { Program, Team } from '../entity/Team';
import { Match, MatchLevel } from '../entity/Match';
import { MatchTeam, Side } from '../entity/MatchTeam';
import { Alliance } from '../entity/Alliance';
import { Award, AwardType } from '../entity/Award';
import { AwardRecipient } from '../entity/AwardRecipient';
import { Robot } from '../entity/Robot';
import { Media, MediaType } from '../entity/Media';
import { SocialMedia, SocialMediaType } from '../entity/SocialMedia';
import { Webcast, WebcastType } from '../entity/Webcast';
import { Video, VideoType } from '../entity/Video';
import { Ranking } from '../entity/Ranking';

interface ScoreData {
  scoreRedTeleop?: number;
  scoreRedFoul?: number;
  scoreRedAuto?: number;
  scoreRedAutoBonus?: number;
  scoreRedEnd?: number;
  scoreRedTotal?: number;
  scoreBlueTeleop?: number;
  scoreBlueFoul?: number;
  scoreBlueAuto?: number;
  scoreBlueAutoBonus?: number;
  scoreBlueEnd?: number;
  scoreBlueTotal?: number;
}

@Service()
export class TheBlueAlliance  {

  constructor(
    private idGenerator: IDGenerator,
    private redisCache: RedisCache
  ) { }

  private async request(url: string) {
    return fetch(TBA_URL + url, {
      headers: {
        'X-TBA-Auth-Key': TBA_KEY
      }
    }).then(res => res.json());
  }

  private convertWebcast(data: any): Webcast {
    return {
      type: this.convertWebcastType(data.type),
      data: data.channel,
      file: data.file
    };
  }

  private convertWebcastType(type: string): WebcastType {
    switch (type) {
      case 'youtube': return WebcastType.YOUTUBE;
      case 'twitch': return WebcastType.TWITCH;
      case 'ustream': return WebcastType.USTREAM;
      case 'iframe': return WebcastType.IFRAME;
      case 'html5': return WebcastType.HTML5;
      case 'rtmp': return WebcastType.RTMP;
      case 'livestream': return WebcastType.LIVESTREAM;
    }
  }

  private convertEventDate(data: string): Date {
    const split: string[] = data.split('-');
    return new Date(split[0] as any * 1, split[1] as any * 1, split[2] as any * 1);
  }

  private convertEvent(id: string, data: any): Event {
    const event: Event = {
      id,
      code: (data.event_code as string).toUpperCase(),
      name: data.name,
      divisions: this.convertDivisions(data.division_keys),
      playoffType: this.convertPlayoffType(data.playoff_type),
      address: data.address,
      venue: data.location_name,
      dateStart: data.start_date,
      dateEnd: data.end_date,
      city: data.city,
      countryCode: data.country,
      stateProv: data.state_prov,
      timezone: data.timezone,
      type: this.convertEventType(data.event_type),
      website: data.website,
      program: Program.FRC,
      webcasts: [],
      season: data.year
    };
    const webcasts: Webcast[] = [];
    for (const webcast of data.webcasts) {
      webcasts.push(this.convertWebcast(webcast));
    }
    event.webcasts = webcasts;
    return event;
  }

  private convertPlayoffType(type: number): PlayoffType {
    switch (type) {
      case 0: return PlayoffType.BRACKET_8_TEAM;
      case 1: return PlayoffType.BRACKET_16_TEAM;
      case 2: return PlayoffType.BRACKET_4_TEAM;
      case 3: return PlayoffType.AVG_SCORE_8_TEAM;
      case 4: return PlayoffType.ROUND_ROBIN_6_TEAM;
      case 5: return PlayoffType.DOUBLE_ELIM_8_TEAM;
      case 6: return PlayoffType.BO5_FINALS;
      case 7: return PlayoffType.BO3_FINALS;
    }
  }

  private convertEventType(type: number): EventType {
    switch (type) {
      case 0: return EventType.REGIONAL;
      case 1: return EventType.DISTRICT_EVENT;
      case 2: return EventType.DISTRICT_CHAMPIONSHIP;
      case 3: return EventType.CHAMPIONSHIP_DIVISION;
      case 4: return EventType.CHAMPIONSHIP;
      case 5: return EventType.DISTRICT_CHAMPIONSHIP_DIVISION;
      case 6: return EventType.FOC;
      case 99: return EventType.OFF_SEASON;
      case 100: return EventType.MEET;
      case -1: return EventType.UNLABLED;
    }
  }

  private convertDivisions(rawDivisions: string[]): string[] {
    const divisionIDs: string[] = [];
    for (const division of rawDivisions) {
      divisionIDs.push(
        this.idGenerator.event(
          division.substr(0, 4) as any * 1,
          division.substring(4).toUpperCase()
        )
      );
    }
    return divisionIDs;
  }

  public async findEvent(id: string): Promise<Event> {
    const eventData = this.idGenerator.decodeEvent(id);
    return this.request(
      'event/' + eventData.season + eventData.code.toLowerCase()
    ).then((rawEvent: any) => {
      if (rawEvent.Errors) return null;
      return this.convertEvent(
        this.idGenerator.event(rawEvent.year, (rawEvent.event_code as string).toUpperCase()),
        rawEvent
      );
    });
  }

  private convertMatchTeams(match: Match, side: Side, allianceData: any): MatchTeam[] {
    const matchTeams: MatchTeam[] = [];
    for (const team of allianceData.team_keys as string[]) {
      matchTeams.push({
        match,
        side,
        matchNumber: match.number,
        matchSetNumber: match.setNumber,
        matchLevel: match.level,
        team: team.substring(3) as any * 1,
        dq: false,
        surrogate: false
      });
    }
    for (const team of allianceData.surrogate_team_keys as string[]) {
      matchTeams.push({
        match,
        side,
        matchNumber: match.number,
        matchSetNumber: match.setNumber,
        matchLevel: match.level,
        team: team.substring(3) as any * 1,
        dq: false,
        surrogate: true
      });
    }
    for (const team of allianceData.dq_team_keys as string[]) {
      matchTeams.push({
        match,
        side,
        matchNumber: match.number,
        matchSetNumber: match.setNumber,
        matchLevel: match.level,
        team: team.substring(3) as any * 1,
        dq: true,
        surrogate: false
      });
    }
    return matchTeams;
  }

  private convertOldScores(scoreBreakdown: any): ScoreData {
    return {
      scoreRedAuto: scoreBreakdown.red.auto_points,
      scoreRedTeleop: scoreBreakdown.red.teleop_points,
      scoreRedFoul: scoreBreakdown.red.foul_points,
      scoreRedTotal: scoreBreakdown.red.total_points,
      scoreBlueAuto: scoreBreakdown.blue.auto_points,
      scoreBlueTeleop: scoreBreakdown.blue.teleop_points,
      scoreBlueFoul: scoreBreakdown.blue.foul_points,
      scoreBlueTotal: scoreBreakdown.blue.total_points
    };
  }

  private convertNewScores(scoreBreakdown: any): ScoreData {
    return {
      scoreRedAuto: scoreBreakdown.red.autoPoints,
      scoreRedTeleop: scoreBreakdown.red.teleopPoints,
      scoreRedFoul: scoreBreakdown.red.foulPoints,
      scoreRedTotal: scoreBreakdown.red.totalPoints,
      scoreBlueAuto: scoreBreakdown.blue.autoPoints,
      scoreBlueTeleop: scoreBreakdown.blue.teleopPoints,
      scoreBlueFoul: scoreBreakdown.blue.foulPoints,
      scoreBlueTotal: scoreBreakdown.blue.totalPoints
    };
  }

  private convertScores(season: number, data: any): ScoreData {
    switch (season) {
      case 2015: return this.convertOldScores(data.score_breakdown);
      case 2016: return this.convertNewScores(data.score_breakdown);
      case 2017: return this.convertNewScores(data.score_breakdown);
      case 2018: return this.convertNewScores(data.score_breakdown);
      default: return this.convertNewScores(data.score_breakdown);
    }
  }

  private convertMatchVideoType(type: string): VideoType {
    switch (type) {
      case 'tba': return VideoType.TBA;
      case 'youtube': return VideoType.YOUTUBE;
    }
  }

  private convertMatchVideo(data: any): Video {
    return {
      type: this.convertMatchVideoType(data.type),
      key: data.key
    };
  }

  private convertMatch(id: string, event: Event, data: any): Match {
    const match: Match = {
      id,
      event,
      number: data.match_number,
      setNumber: data.set_number,
      level: this.convertMatchLevel(data.comp_level),
      actualStartTime: new Date(data.actual_time * 1000),
      postResultTime: new Date(data.post_result_time * 1000),
      details: data.score_breakdown,
      teams: [],
      winner: (data.winning_alliance === 'blue') ? Side.BLUE : Side.RED,
      ...this.convertScores(event.season, data)
    };
    const blueTeams = this.convertMatchTeams(
      match,
      Side.BLUE,
      data.alliances.blue
    );
    const redTeams = this.convertMatchTeams(
      match,
      Side.RED,
      data.alliances.red
    );
    match.teams = [...blueTeams, ...redTeams];
    return match;
  }

  private convertMatchLevel(level: string): MatchLevel {
    switch (level) {
      case 'qm': return MatchLevel.QM;
      case 'ef': return MatchLevel.EF;
      case 'qf': return MatchLevel.QF;
      case 'sf': return MatchLevel.SF;
      case 'f': return MatchLevel.F;
    }
  }

  public async findMatches(event: Event): Promise<Match[]> {
    return this.request(
      'event/' + event.season + event.code.toLowerCase() +
      '/matches'
    ).then((rawMatches: any) => {
      const matches: Match[] = [];
      for (const data of rawMatches) {
        matches.push(
          this.convertMatch(
            this.idGenerator.match(
              data.match_number,
              data.set_number,
              this.convertMatchLevel(data.comp_level),
              event.id
            ),
            event,
            data
          )
        );
      }
      return matches;
    });
  }

  private convertAlliance(event: Event, number: number, data: any): Alliance {
    const picks: number[] = [];
    for (const pick of (data.picks as string[]).slice(1)) {
      picks.push(pick.substring(3) as any * 1);
    }
    return {
      event,
      picks,
      number,
      name: data.name,
      captain: picks[0],
      backup: data.backup ? data.backup.in.substring(3) as any * 1 : null,
      backupReplaced: data.backup ? data.backup.out.substring(3) as any * 1 : null,
    };
  }

  public async findAlliances(event: Event): Promise<Alliance[]> {
    return this.request(
      'event/' + event.season + event.code.toLowerCase() +
      '/alliances'
    ).then((rawAlliances: any) => {
      const alliances: Alliance[] = [];
      for (const index in rawAlliances as any[]) {
        alliances.push(this.convertAlliance(event, (index as any * 1) + 1, rawAlliances[index]));
      }
      return alliances;
    });
  }

  private convertAwardType(type: number): AwardType {
    switch (type) {
      case 0: return AwardType.CHAIRMANS;
      case 1: return AwardType.WINNER;
      case 2: return AwardType.FINALIST;
      case 3: return AwardType.WOODIE_FLOWERS;
      case 4: return AwardType.DEANS_LIST;
      case 5: return AwardType.VOLUNTEER;
      case 6: return AwardType.FOUNDERS;
      case 7: return AwardType.BART_KAMEN_MEMORIAL;
      case 8: return AwardType.MAKE_IT_LOUD;
      case 9: return AwardType.ENGINEERING_INSPIRATION;
      case 10: return AwardType.ROOKIE_ALL_STAR;
      case 11: return AwardType.GRACIOUS_PROFESSIONALISM;
      case 12: return AwardType.COOPERTITION;
      case 13: return AwardType.JUDGES;
      case 14: return AwardType.HIGHEST_ROOKIE_SEED;
      case 15: return AwardType.ROOKIE_INSPIRATION;
      case 16: return AwardType.INDUSTRIAL_DESIGN;
      case 17: return AwardType.QUALITY;
      case 18: return AwardType.SAFETY;
      case 19: return AwardType.SPORTSMANSHIP;
      case 20: return AwardType.CREATIVITY;
      case 21: return AwardType.ENGINEERING_EXCELLENCE;
      case 22: return AwardType.ENTREPRENEURSHIP;
      case 23: return AwardType.EXCELLENCE_IN_DESIGN;
      case 24: return AwardType.EXCELLENCE_IN_DESIGN_CAD;
      case 25: return AwardType.EXCELLENCE_IN_DESIGN_ANIMATION;
      case 26: return AwardType.DRIVING_TOMORROWS_TECHNOLOGY;
      case 27: return AwardType.IMAGERY;
      case 28: return AwardType.MEDIA_AND_TECHNOLOGY;
      case 29: return AwardType.INNOVATION_IN_CONTROL;
      case 30: return AwardType.SPIRIT;
      case 31: return AwardType.WEBSITE;
      case 32: return AwardType.VISUALIZATION;
      case 33: return AwardType.AUTODESK_INVENTOR;
      case 34: return AwardType.FUTURE_INNOVATOR;
      case 35: return AwardType.RECOGNITION_OF_EXTRAORDINARY_SERVICE;
      case 36: return AwardType.OUTSTANDING_CART;
      case 37: return AwardType.WSU_AIM_HIGHER;
      case 38: return AwardType.LEADERSHIP_IN_CONTROL;
      case 39: return AwardType.NUM_1_SEED;
      case 40: return AwardType.INCREDIBLE_PLAY;
      case 41: return AwardType.PEOPLES_CHOICE_ANIMATION;
      case 42: return AwardType.VISUALIZATION_RISING_STAR;
      case 43: return AwardType.BEST_OFFENSIVE_ROUND;
      case 44: return AwardType.BEST_PLAY_OF_THE_DAY;
      case 45: return AwardType.FEATHERWEIGHT_IN_THE_FINALS;
      case 46: return AwardType.MOST_PHOTOGENIC;
      case 47: return AwardType.OUTSTANDING_DEFENSE;
      case 48: return AwardType.POWER_TO_SIMPLIFY;
      case 49: return AwardType.AGAINST_ALL_ODDS;
      case 50: return AwardType.RISING_STAR;
      case 51: return AwardType.CHAIRMANS_HONORABLE_MENTION;
      case 52: return AwardType.CONTENT_COMMUNICATION_HONORABLE_MENTION;
      case 53: return AwardType.TECHNICAL_EXECUTION_HONORABLE_MENTION;
      case 54: return AwardType.REALIZATION;
      case 55: return AwardType.REALIZATION_HONORABLE_MENTION;
      case 56: return AwardType.DESIGN_YOUR_FUTURE;
      case 57: return AwardType.DESIGN_YOUR_FUTURE_HONORABLE_MENTION;
      case 58: return AwardType.SPECIAL_RECOGNITION_CHARACTER_ANIMATION;
      case 59: return AwardType.HIGH_SCORE;
      case 60: return AwardType.TEACHER_PIONEER;
      case 61: return AwardType.BEST_CRAFTSMANSHIP;
      case 62: return AwardType.BEST_DEFENSIVE_MATCH;
      case 63: return AwardType.PLAY_OF_THE_DAY;
      case 64: return AwardType.PROGRAMMING;
      case 65: return AwardType.PROFESSIONALISM;
      case 66: return AwardType.GOLDEN_CORNDOG;
      case 67: return AwardType.MOST_IMPROVED_TEAM;
      case 68: return AwardType.WILDCARD;
      case 69: return AwardType.CHAIRMANS_FINALIST;
      case 70: return AwardType.OTHER;
      case 71: return AwardType.AUTONOMOUS;
    }
  }

  private convertAward(event: Event, data: any): Award {
    const award: Award = {
      event,
      type: this.convertAwardType(data.award_type),
      name: data.name,
      year: data.year,
      recipients: []
    };
    const recipients: AwardRecipient[] = [];
    for (const recipient of data.recipient_list) {
      recipients.push({
        award,
        team: recipient.team_key ? recipient.team_key.substring(3) as any * 1 : null,
        person: recipient.awardee
      });
    }
    award.recipients = recipients;
    return award;
  }

  public async findAwards(event: Event): Promise<Award[]> {
    return this.request(
      'event/' + event.season + event.code.toLowerCase() +
      '/awards'
    ).then((rawAwards: any) => {
      const awards: Award[] = [];
      for (const data of rawAwards) {
        awards.push(this.convertAward(event, data));
      }
      return awards;
    });
  }

  private convertRanking(event: Event, data: any): Ranking {
    return {
      event,
      rank: data.rank,
      dq: data.dq,
      matchesPlayed: data.matches_played,
      losses: data.record.losses,
      wins: data.record.wins,
      ties: data.record.ties,
      team: data.team_key.substring(3) as any * 1
    };
  }

  public async findRankings(event: Event): Promise<Ranking[]> {
    return this.request(
      'event/' + event.season + event.code.toLowerCase() +
      '/rankings'
    ).then((rawRankings: any) => {
      const rankings: Ranking[] = [];
      for (const data of rawRankings.rankings) {
        rankings.push(this.convertRanking(event, data));
      }
      return rankings;
    });
  }

  private convertRobot(data: any): Robot {
    return {
      year: data.year,
      name: data.robot_name
    };
  }

  public async findTeamRobots(team: Team): Promise<Robot[]> {
    return this.request(
      'team/frc' + team.number.toString() +
      '/robots'
    ).then((rawRobots: any) => {
      const robots: Robot[] = [];
      for (const data of rawRobots) {
        robots.push(this.convertRobot(data));
      }
      return robots;
    });
  }

  public async findTeamAwards(team: Team): Promise<Award[]> {
    return this.request(
      'team/frc' + team.number.toString() +
      '/awards'
    ).then((rawAwards: any) => {
      const awards: Award[] = [];
      for (const data of rawAwards) {
        awards.push(this.convertAward(null, data));
      }
      return awards;
    });
  }

  public async findTeamEvents(team: Team): Promise<Event[]> {
    return this.request(
      'team/frc' + team.number.toString() +
      '/events'
    ).then((rawEvents: any) => {
      const events: Event[] = [];
      for (const data of rawEvents) {
        events.push(
          this.convertEvent(
            this.idGenerator.event(data.year, (data.event_code as string).toUpperCase()),
            data
          )
        );
      }
      return events;
    });
  }

  private convertMediaType(type: string): MediaType {
    switch (type) {
      case 'youtube': return MediaType.YOUTUBE;
      case 'cdphotothread': return MediaType.CDPHOTOTHREAD;
      case 'imgur': return MediaType.IMGUR;
      case 'grabcad': return MediaType.GRABCAD;
      case 'instagram-image': return MediaType.INSTAGRAM_IMAGE;
      case 'external-link': return MediaType.LINK;
      case 'avatar': return MediaType.AVATAR;
    }
  }

  private convertMedia(data: any): Media {
    return {
      type: this.convertMediaType(data.type),
      key: data.foreign_key
    };
  }

  public async findTeamMedia(team: Team, year: number): Promise<Media[]> {
    return this.request(
      'team/frc' + team.number.toString() +
      '/media/' + year.toString()
    ).then((rawMedia: any) => {
      const media: Media[] = [];
      for (const data of rawMedia) {
        media.push(this.convertMedia(data));
      }
      return media;
    });
  }

  private convertSocialMediaType(type: string): SocialMediaType {
    switch (type) {
      case 'facebook-profile': return SocialMediaType.FACEBOOK;
      case 'youtube-channel': return SocialMediaType.YOUTUBE;
      case 'twitter-profile': return SocialMediaType.TWITTER;
      case 'github-profile': return SocialMediaType.GITHUB;
      case 'instagram-profile': return SocialMediaType.INSTAGRAM;
      case 'periscope-profile': return SocialMediaType.PERISCOPE;
    }
  }

  private convertSocialMedia(data: any): SocialMedia {
    return {
      type: this.convertSocialMediaType(data.type),
      username: data.foreign_key
    };
  }

  public async findTeamSocialMedia(team: Team): Promise<SocialMedia[]> {
    return this.request(
      'team/frc' + team.number.toString() +
      '/social_media'
    ).then((rawMedia: any) => {
      const media: SocialMedia[] = [];
      for (const data of rawMedia) {
        media.push(this.convertSocialMedia(data));
      }
      return media;
    });
  }

  public async findMatchVideos(match: Match): Promise<Video[]> {
    // Check for cached videos
    const cached = await this.redisCache.get<Video[]>(match.id + '-videos');
    if (cached) return cached;
    return this.request(
      'match/' +
      (match.event as Event).season.toString() +
      (match.event as Event).code.toLowerCase() + '_' +
      match.level.toString().toLowerCase() +
      (match.level !== MatchLevel.QM ? (match.setNumber.toString() + 'm') : '') +
      match.number.toString()
    ).then((rawMatch: any) => {
      const videos: Video[] = [];
      if (rawMatch.videos) {
        for (const data of rawMatch.videos) {
          videos.push(this.convertMatchVideo(data));
        }
        // Cache the videos
        return this.redisCache.setKey(match.id + '-videos', videos).then(() => {
          return videos;
        });
      }
      return [];
    });
  }

}
