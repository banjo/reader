#!/bin/bash

# Usage: ./scripts/logs.sh <service-name>
# Example: ./scripts/logs.sh banjo-rss-api

SERVICE=$1
ssh dokku "dokku logs $SERVICE -t"
