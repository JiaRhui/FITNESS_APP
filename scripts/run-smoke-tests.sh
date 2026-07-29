#!/usr/bin/env bash

# Smoke-test the running staging application with curl. This script does not
# create or delete user data. It only checks safe read/error responses.

set -u

BACKEND_URL="${BACKEND_URL:-http://localhost:4001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:4000}"
CURL_TIMEOUT="${CURL_TIMEOUT:-15}"
WAIT_ATTEMPTS="${WAIT_ATTEMPTS:-30}"
WAIT_SECONDS="${WAIT_SECONDS:-2}"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

BACKEND_CHECKS=0
BACKEND_PASSED=0
BACKEND_FAILED=0
FRONTEND_CHECKS=0
FRONTEND_PASSED=0
FRONTEND_FAILED=0

wait_for_url() {
  local url="$1"
  local label="$2"
  local attempt

  printf 'Waiting for %s at %s\n' "$label" "$url"
  for ((attempt = 1; attempt <= WAIT_ATTEMPTS; attempt++)); do
    if curl --silent --fail --max-time "$CURL_TIMEOUT" "$url" > /dev/null 2>&1; then
      printf '%s is ready.\n' "$label"
      return 0
    fi
    sleep "$WAIT_SECONDS"
  done

  printf '%s did not become ready after %d attempts.\n' "$label" "$WAIT_ATTEMPTS" >&2
  return 1
}

record_backend() {
  local result="$1"
  BACKEND_CHECKS=$((BACKEND_CHECKS + 1))
  if [[ "$result" == "pass" ]]; then
    BACKEND_PASSED=$((BACKEND_PASSED + 1))
  else
    BACKEND_FAILED=$((BACKEND_FAILED + 1))
  fi
}

record_frontend() {
  local result="$1"
  FRONTEND_CHECKS=$((FRONTEND_CHECKS + 1))
  if [[ "$result" == "pass" ]]; then
    FRONTEND_PASSED=$((FRONTEND_PASSED + 1))
  else
    FRONTEND_FAILED=$((FRONTEND_FAILED + 1))
  fi
}

request_status() {
  local output_file="$1"
  shift
  curl --silent --show-error --max-time "$CURL_TIMEOUT" \
    --output "$output_file" \
    --write-out '%{http_code}' \
    "$@" 2> "${output_file}.error" || printf '000'
}

printf '\nRunning smoke curl tests...\n'

# Readiness is separate from the six scored smoke checks.
wait_for_url "$BACKEND_URL/health" 'Backend' || true
wait_for_url "$FRONTEND_URL/pages/login.html" 'Frontend' || true

# 1. Backend health endpoint: HTTP 200 and status OK (case-insensitive).
body="$TMP_DIR/health.json"
status=$(request_status "$body" "$BACKEND_URL/health")
if [[ "$status" == '200' ]] && grep -Eqi '"status"[[:space:]]*:[[:space:]]*"ok"' "$body"; then
  printf 'PASS: GET /health returned HTTP 200 and status OK.\n'
  record_backend pass
else
  printf 'FAIL: GET /health expected HTTP 200 and status OK, received HTTP %s.\n' "$status"
  cat "$body" 2>/dev/null || true
  record_backend fail
fi

# 2. Anonymous session endpoint: HTTP 200 and loggedIn false.
body="$TMP_DIR/session.json"
status=$(request_status "$body" "$BACKEND_URL/api/auth/session")
if [[ "$status" == '200' ]] && grep -Eq '"loggedIn"[[:space:]]*:[[:space:]]*false' "$body"; then
  printf 'PASS: GET /api/auth/session returned an anonymous session.\n'
  record_backend pass
else
  printf 'FAIL: GET /api/auth/session expected HTTP 200 and loggedIn false, received HTTP %s.\n' "$status"
  cat "$body" 2>/dev/null || true
  record_backend fail
fi

# 3. Empty login: HTTP 400 and a failed response. No data is changed.
body="$TMP_DIR/login.json"
status=$(request_status "$body" \
  --request POST \
  --header 'Content-Type: application/json' \
  --data '{"email":"","password":""}' \
  "$BACKEND_URL/api/auth/login")
if [[ "$status" == '400' ]] && grep -Eq '"success"[[:space:]]*:[[:space:]]*false' "$body"; then
  printf 'PASS: POST /api/auth/login rejected missing credentials with HTTP 400.\n'
  record_backend pass
else
  printf 'FAIL: POST /api/auth/login expected HTTP 400 and success false, received HTTP %s.\n' "$status"
  cat "$body" 2>/dev/null || true
  record_backend fail
fi

# 4. Protected calorie tracker: HTTP 401 without a login.
body="$TMP_DIR/protected.json"
status=$(request_status "$body" "$BACKEND_URL/api/calorie-tracker")
if [[ "$status" == '401' ]] && grep -Eq '"success"[[:space:]]*:[[:space:]]*false' "$body"; then
  printf 'PASS: GET /api/calorie-tracker rejected an anonymous request with HTTP 401.\n'
  record_backend pass
else
  printf 'FAIL: GET /api/calorie-tracker expected HTTP 401 and success false, received HTTP %s.\n' "$status"
  cat "$body" 2>/dev/null || true
  record_backend fail
fi

# 5. Unknown API route: HTTP 404 and a failed response.
body="$TMP_DIR/not-found.json"
status=$(request_status "$body" "$BACKEND_URL/api/does-not-exist")
if [[ "$status" == '404' ]] && grep -Eq '"success"[[:space:]]*:[[:space:]]*false' "$body"; then
  printf 'PASS: Unknown API route returned HTTP 404.\n'
  record_backend pass
else
  printf 'FAIL: Unknown API route expected HTTP 404 and success false, received HTTP %s.\n' "$status"
  cat "$body" 2>/dev/null || true
  record_backend fail
fi

# 6. Frontend login page: HTTP 200 and non-empty HTML.
body="$TMP_DIR/login.html"
status=$(request_status "$body" "$FRONTEND_URL/pages/login.html")
if [[ "$status" == '200' ]] && [[ -s "$body" ]]; then
  printf 'PASS: Frontend login page returned HTTP 200.\n'
  record_frontend pass
else
  printf 'FAIL: Frontend login page expected HTTP 200 and non-empty HTML, received HTTP %s.\n' "$status"
  record_frontend fail
fi

TOTAL_CHECKS=$((BACKEND_CHECKS + FRONTEND_CHECKS))
TOTAL_PASSED=$((BACKEND_PASSED + FRONTEND_PASSED))
TOTAL_FAILED=$((BACKEND_FAILED + FRONTEND_FAILED))

backend_rate=$(awk -v p="$BACKEND_PASSED" -v c="$BACKEND_CHECKS" 'BEGIN { printf "%.2f%%", c ? (p / c) * 100 : 0 }')
frontend_rate=$(awk -v p="$FRONTEND_PASSED" -v c="$FRONTEND_CHECKS" 'BEGIN { printf "%.2f%%", c ? (p / c) * 100 : 0 }')
total_rate=$(awk -v p="$TOTAL_PASSED" -v c="$TOTAL_CHECKS" 'BEGIN { printf "%.2f%%", c ? (p / c) * 100 : 0 }')

printf '\n%-17s | %6s | %6s | %6s | %9s\n' \
  'Component' 'Checks' 'Passed' 'Failed' 'Pass Rate'
printf '%-17s-|-%6s-|-%6s-|-%6s-|-%9s\n' \
  '-----------------' '------' '------' '------' '---------'
printf '%-17s | %6d | %6d | %6d | %9s\n' \
  'Backend API' "$BACKEND_CHECKS" "$BACKEND_PASSED" "$BACKEND_FAILED" "$backend_rate"
printf '%-17s | %6d | %6d | %6d | %9s\n' \
  'Frontend' "$FRONTEND_CHECKS" "$FRONTEND_PASSED" "$FRONTEND_FAILED" "$frontend_rate"
printf '%-17s-|-%6s-|-%6s-|-%6s-|-%9s\n' \
  '-----------------' '------' '------' '------' '---------'
printf '%-17s | %6d | %6d | %6d | %9s\n' \
  'All components' "$TOTAL_CHECKS" "$TOTAL_PASSED" "$TOTAL_FAILED" "$total_rate"

if (( TOTAL_FAILED > 0 )); then
  printf '\nSMOKE CURL TESTS FAILED\n'
  exit 1
fi

printf '\nSMOKE CURL TESTS PASSED\n'
