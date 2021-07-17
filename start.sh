#!/bin/sh

if [ "$NODE_ENV" == "production" ] ; then
  yarn build
  yarn typeorm migration:run
  yarn seed:run
  pm2 start dist/server.js --name ProdepaSurvey
  pm2 monit
else
  yarn start:prod
fi