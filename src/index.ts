import { bootstrap, Action } from 'vesper';
import * as dotenv from 'dotenv';
import { CurrentUser } from './auth/CurrentUser';
import {
  GraphQLDate,
  GraphQLTime,
  GraphQLDateTime
} from 'graphql-iso-date';

// Use the .env file if not in production
if (process.env.NODE_ENV !== 'prod') {
  dotenv.config();
}

// Define configuration variables
const REDIS_URL = process.env.REDIS_URL;
const PORT = parseInt(process.env.PORT, 2) || 3000;
export const JWT_SECRET = process.env.JWT_SECRET;
export const TBA_KEY = process.env.TBA_KEY;
export const TBA_URL = process.env.TBA_URL;

import { RedisCache } from './util/RedisCache';

// Connect to the Redis database
RedisCache.connect(REDIS_URL);

// Import services
import { JWT } from './auth/JWT';
import { ScopeTools } from './auth/ScopeTools';

// Import controllers
import { UserController } from './controller/UserController';
import { TeamController } from './controller/TeamController';
import { EventController } from './controller/EventController';
import { NodeController } from './controller/NodeController';
import { SeasonController } from './controller/SeasonController';
import { CountryController } from './controller/CountryController';
import { AuthController } from './controller/AuthController';

// Import entities
import { User } from './entity/User';
import { Event } from './entity/Event';
import { Match } from './entity/Match';
import { Team } from './entity/Team';
import { MatchTeam } from './entity/MatchTeam';
import { Alliance } from './entity/Alliance';
import { Award } from './entity/Award';
import { Role } from './entity/Role';
import { Ranking } from './entity/Ranking';

// Import resolvers
import { resolveType } from './entity/Node';
import { TeamResolver } from './resolver/TeamResolver';
import { EventResolver } from './resolver/EventResolver';
import { MatchResolver } from './resolver/MatchResolver';
import { MatchTeamResolver } from './resolver/MatchTeamResolver';
import { AllianceResolver } from './resolver/AllianceResolver';
import { AwardResolver } from './resolver/AwardResolver';
import { AwardRecipient } from './entity/AwardRecipient';
import { AwardRecipientResolver } from './resolver/AwardRecipientResolver';
import { RankingResolver } from './resolver/RankingResolver';

// Start vesper
bootstrap({
  port: PORT,
  controllers: [
    NodeController,
    UserController,
    TeamController,
    EventController,
    SeasonController,
    CountryController,
    AuthController
  ],
  entities: [
    User,
    Event,
    Match,
    Team,
    MatchTeam,
    Alliance,
    Award,
    AwardRecipient,
    Role,
    Ranking
  ],
  resolvers: [
    TeamResolver,
    EventResolver,
    MatchResolver,
    MatchTeamResolver,
    AllianceResolver,
    AwardResolver,
    AwardRecipientResolver,
    RankingResolver
  ],
  customResolvers: {
    Node: {
      __resolveType: data => resolveType(data),
    },
    Date: GraphQLDate,
    Time: GraphQLTime,
    DateTime: GraphQLDateTime
  },
  playground: process.env.NODE_ENV !== 'prod',
  schemas: [__dirname + '/schema/**/*.graphql'],
  cors: true,
  authorizationChecker: async (scopes: string[], action: Action) => {
    // Get the current user from the container
    const currentUser = action.container.get(CurrentUser);
    // Make sure that the current user has all required scopes
    if (!currentUser.hasScopes(scopes)) {
      throw new Error('Missing required scopes ' + scopes);
    }
  },
  setupContainer: async (container, action) => {
    // Get the HTTP request
    const request = action.request;
    let currentUser;
    const auth = request.headers.authorization;
    // If there is an auth token attempt to get the current user
    if (auth) {
      const token = auth.split(' ')[1];
      currentUser = await container.get(JWT).decodeToken(token);
    } else {
      // Load the guest role scopes from the DB
      const guestRole = await container.get(ScopeTools).findRole('guest');
      currentUser = new CurrentUser(null, guestRole.scopes);
    }
    // Set the currentUser on the request container
    container.set(CurrentUser, currentUser);
  }
}).then(() => {
  console.log(`App started on port ${PORT}`);
}).catch((error) => {
  console.error(error.stack ? error.stack : error);
});
