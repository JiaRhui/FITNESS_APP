#!/usr/bin/env bash

# One-command local test runner:
#   1. Hadolint all Dockerfiles
#   2. Build/start the staging application
#   3. Smoke-test backend APIs and frontend with curl
#   4. Stop the staging containers automatically

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

KEEP_CONTAINERS="${KEEP_CONTAINERS:-0}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.staging.yml}"

cleanup() {
  exit_code=$?

  if [[ "$KEEP_CONTAINERS" == '1' ]]; then
    printf '\nKeeping staging containers running because KEEP_CONTAINERS=1.\n'
  else
    printf '\nStopping staging containers...\n'
    docker compose -f "$COMPOSE_FILE" down --remove-orphans >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}
trap cleanup EXIT

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Required command not found: %s\n' "$command_name" >&2
    exit 1
  fi
}

require_command docker
require_command curl

if ! docker compose version >/dev/null 2>&1; then
  printf 'Docker Compose v2 is required. The command "docker compose version" failed.\n' >&2
  exit 1
fi

printf '\n========================================\n'
printf '1/3  HADOLINT\n'
printf '========================================\n'
bash scripts/run-hadolint.sh

printf '\n========================================\n'
printf '2/3  BUILD AND START STAGING\n'
printf '========================================\n'
docker compose -f "$COMPOSE_FILE" up -d --build

printf '\n========================================\n'
printf '3/3  SMOKE CURL TESTS\n'
printf '========================================\n'
BACKEND_URL="${BACKEND_URL:-http://localhost:4001}" \
FRONTEND_URL="${FRONTEND_URL:-http://localhost:4000}" \
  bash scripts/run-smoke-tests.sh

printf '\n========================================\n'
printf 'EVERYTHING PASSED\n'
printf 'Hadolint: PASS\n'
printf 'Smoke Curl API Tests: PASS\n'
printf '========================================\n'
