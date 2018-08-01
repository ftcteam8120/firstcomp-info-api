import { Role } from '../entity/Role';

export enum ScopeAction {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export interface Scope {
  entity: string;
  actions: ScopeAction[];
  fields: string[];
}

export const SCOPES: Scope[] = [
  {
    entity: 'event',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE,
      ScopeAction.ADMIN
    ],
    fields: [
      'divisions',
      'address',
      'name',
      'description',
      'venue',
      'city',
      'week',
      'countryCode',
      'timezone',
      'stateProv',
      'postalCode',
      'dateStart',
      'dateEnd',
      'type',
      'website',
      'matches',
      'alliances',
      'awards',
      'articles',
      'webcasts',
      'rankings',
      'season'
    ]
  },
  {
    entity: 'match',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'actualStartTime',
      'postResultTime',
      'event',
      'description',
      'scoreRedTeleop',
      'scoreRedFoul',
      'scoreRedAuto',
      'scoreRedAutoBonus',
      'scoreRedEnd',
      'scoreRedTotal',
      'scoreBlueTeleop',
      'scoreBlueFoul',
      'scoreBlueAuto',
      'scoreBlueAutoBonus',
      'scoreBlueEnd',
      'scoreBlueTotal',
      'details',
      'teams',
      'videos'
    ]
  },
  {
    entity: 'match_team',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'team',
      'side',
      'dq',
      'surrogate'
    ]
  },
  {
    entity: 'media',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'type',
      'key'
    ]
  },
  {
    entity: 'social_media',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'type',
      'username'
    ]
  },
  {
    entity: 'ranking',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'rank',
      'dq',
      'matchesPlayed',
      'losses',
      'wins',
      'ties',
      'team'
    ]
  },
  {
    entity: 'robot',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'year',
      'name'
    ]
  },
  {
    entity: 'season',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'name',
      'program',
      'startYear',
      'article'
    ]
  },
  {
    entity: 'team',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'name',
      'sponsors',
      'robots',
      'city',
      'stateProv',
      'countryCode',
      'rookieYear',
      'districtCode',
      'website',
      'season',
      'profileYear',
      'awards',
      'events',
      'media',
      'socialMedia'
    ]
  },
  {
    entity: 'user',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE,
      ScopeAction.ADMIN
    ],
    fields: [
      'firstName',
      'lastName',
      'email',
      'photoUrl',
      'password'
    ]
  },
  {
    entity: 'alliance',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'name',
      'captain',
      'round1',
      'round2',
      'round3',
      'backup',
      'backupReplaced'
    ]
  },
  {
    entity: 'award',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'type',
      'name',
      'recipients',
      'year'
    ]
  },
  {
    entity: 'award_recipient',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'team',
      'person'
    ]
  },
  {
    entity: 'ranking',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'rank',
      'dq',
      'matchesPlayed',
      'losses',
      'wins',
      'team'
    ]
  },
  {
    entity: 'video',
    actions: [
      ScopeAction.READ
    ],
    fields: [
      'type',
      'key'
    ]
  },
  {
    entity: 'webcast',
    actions: [
      ScopeAction.READ
    ],
    fields: [
      'type',
      'data',
      'file'
    ]
  },
  {
    entity: 'alliance',
    actions: [
      ScopeAction.READ,
      ScopeAction.WRITE
    ],
    fields: [
      'number',
      'name',
      'captain',
      'picks',
      'backup',
      'backupReplaced'
    ]
  },
  {
    entity: 'country',
    actions: [
      ScopeAction.READ
    ],
    fields: [
      'name',
      'code'
    ]
  },
  {
    entity: 'article',
    actions: [
      ScopeAction.READ
    ],
    fields: [
      'featured',
      'title',
      'tags',
      'description',
      'photoUrl',
      'url',
      'data'
    ]
  }
];

function getAllScopes(...actions: ScopeAction[]): string[] {
  const scopes: string[] = [];
  for (const scope of SCOPES) {
    scopes.push(scope.entity + ':' + (actions as string[]).join(','));
  }
  return scopes;
}

export const ROLES: Role[] = [
  {
    name: 'guest',
    scopes: getAllScopes(ScopeAction.READ)
  },
  {
    name: 'user',
    scopes: getAllScopes(ScopeAction.READ)
  }
];
