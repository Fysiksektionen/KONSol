#!/bin/bash

. ../.env

if [ "$KONSOL_NODE_ENV" == "production" ] ; then
  npm run start
else
  npm run dev
fi