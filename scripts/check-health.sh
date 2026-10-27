#!/usr/bin/env bash
# Check one or more HTTP endpoints. Exits non-zero on the first failure so a scheduler can alert.
#
# Usage:
#   ./scripts/check-health.sh https://reader.banjoanton.com https://api.example.com/api/health/ready

set -euo pipefail

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 URL [URL...]" >&2
    exit 2
fi

for url in "$@"; do
    status="$(curl --silent --show-error --fail --max-time 10 --output /dev/null --write-out '%{http_code}' "$url")"
    echo "OK $url ($status)"
done
