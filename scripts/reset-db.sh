#!/bin/bash

echo "Stopping docker..."
nr db:local:stop

echo "Removing docker volumes..."
docker volume rm local-dev_redis_data

echo "Starting database..."
nr db:local:start

echo "Reseting database..."
nr db:local:reset