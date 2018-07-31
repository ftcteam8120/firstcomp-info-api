# The RoboScorz GraphQL API
Created by FTC Team 8120

## Steps to run this project:

1. Run `yarn install`
2. Configure environment variables inside the `.env` file
3. Run `yarn start`

## Sample `.env` file
```
TYPEORM_CONNECTION = postgres
TYPEORM_HOST = localhost
TYPEORM_DATABASE = roboscorz
TYPEORM_SYNCHRONIZE = true
TYPEORM_LOGGING = false
PORT = 3000
JWT_SECRET = <JWT_SECRET>
TBA_KEY = <TBA_KEY>
TBA_URL = 'https://www.thebluealliance.com/api/v3/'
TOA_KEY = <TOA_KEY>
TOA_URL = 'https://theorangealliance.org/apiv2/'
TOA_APP = <TOA_APP>
```
