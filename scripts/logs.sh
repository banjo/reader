#!/bin/bash

# Usage: ./scripts/logs.sh <service-name>
# Example: ./scripts/logs.sh banjo-rss-api

SERVICE=$1
ssh caprover "docker service logs srv-captain--$SERVICE --since 60m --follow"
