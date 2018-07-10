import { bootstrap } from 'vesper';
import * as dotenv from 'dotenv';

// Use the .env file if not in production
if (process.env.NODE_ENV !== 'prod') {
  dotenv.config();
}

// Define configuration variables
const REDIS_URL = process.env.REDIS_URL;
const PORT = parseInt(process.env.PORT, 2) || 3000;

import { RedisCache } from './util/RedisCache';

// Connect to the Redis database
RedisCache.connect(REDIS_URL);

// Import controllers
import { UserController } from './controller/UserController';
import { TeamController } from './controller/TeamController';
import { EventController } from './controller/EventController';
import { NodeController } from './controller/NodeController';
import { SeasonController } from './controller/SeasonController';
import { CountryController } from './controller/CountryController';

// Import entities
import { User } from './entity/User';
import { Event } from './entity/Event';
import { Match } from './entity/Match';
import { Team } from './entity/Team';
import { MatchTeam } from './entity/MatchTeam';

// Import resolvers
import { resolveType } from './entity/Node';
import { TeamResolver } from './resolver/TeamResolver';

// Start vesper
bootstrap({
  port: PORT,
  controllers: [
    NodeController,
    UserController,
    TeamController,
    EventController,
    SeasonController,
    CountryController
  ],
  entities: [
    User,
    Event,
    Match,
    Team,
    MatchTeam
  ],
  resolvers: [
    TeamResolver
  ],
  customResolvers: {
    Node: {
      __resolveType: data => resolveType(data),
    }
  },
  playground: process.env.NODE_ENV !== 'prod',
  schemas: [__dirname + '/schema/**/*.graphql'],
  cors: true,
}).then(() => {
  console.log(`App started on port ${PORT}`);
}).catch((error) => {
  console.error(error.stack ? error.stack : error);
});
