#!/usr/bin/env bash

# Run Hadolint against every Dockerfile used by this repository and print
# one summary row per project component.

set -u

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

HADOLINT_IMAGE="${HADOLINT_IMAGE:-hadolint/hadolint:v2.14.0}"

COMPONENTS=(
  "Root / Jenkins"
  "Backend"
  "Frontend"
)

DOCKERFILES=(
  "Dockerfile.jenkins"
  "backend/Dockerfile"
  "frontend/Dockerfile"
)

CHECKS=()
PASSED=()
FAILED=()
RATES=()
LOGS=()

TOTAL_CHECKS=0
TOTAL_PASSED=0
TOTAL_FAILED=0

for index in "${!DOCKERFILES[@]}"; do
  dockerfile="${DOCKERFILES[$index]}"
  log_file="$(mktemp)"
  LOGS+=("$log_file")

  checks=1
  passed=0
  failed=0

  if [[ ! -f "$dockerfile" ]]; then
    printf 'File not found: %s\n' "$dockerfile" > "$log_file"
    failed=1
  elif docker run --rm -i \
      "$HADOLINT_IMAGE" \
      hadolint --failure-threshold error --no-color - \
      < "$dockerfile" > "$log_file" 2>&1; then
    passed=1
  else
    failed=1
  fi

  rate=$(awk -v p="$passed" -v c="$checks" 'BEGIN { printf "%.2f%%", (p / c) * 100 }')

  CHECKS+=("$checks")
  PASSED+=("$passed")
  FAILED+=("$failed")
  RATES+=("$rate")

  TOTAL_CHECKS=$((TOTAL_CHECKS + checks))
  TOTAL_PASSED=$((TOTAL_PASSED + passed))
  TOTAL_FAILED=$((TOTAL_FAILED + failed))
done

printf '\n%-18s | %6s | %6s | %6s | %9s\n' \
  'Component' 'Checks' 'Passed' 'Failed' 'Pass Rate'
printf '%-18s-|-%6s-|-%6s-|-%6s-|-%9s\n' \
  '------------------' '------' '------' '------' '---------'

for index in "${!COMPONENTS[@]}"; do
  printf '%-18s | %6d | %6d | %6d | %9s\n' \
    "${COMPONENTS[$index]}" \
    "${CHECKS[$index]}" \
    "${PASSED[$index]}" \
    "${FAILED[$index]}" \
    "${RATES[$index]}"
done

printf '%-18s-|-%6s-|-%6s-|-%6s-|-%9s\n' \
  '------------------' '------' '------' '------' '---------'

total_rate=$(awk -v p="$TOTAL_PASSED" -v c="$TOTAL_CHECKS" 'BEGIN { printf "%.2f%%", (p / c) * 100 }')
printf '%-18s | %6d | %6d | %6d | %9s\n' \
  'All Dockerfiles' \
  "$TOTAL_CHECKS" \
  "$TOTAL_PASSED" \
  "$TOTAL_FAILED" \
  "$total_rate"

# Show the actual lint messages after the neat summary table.
for index in "${!DOCKERFILES[@]}"; do
  log_file="${LOGS[$index]}"
  if [[ -s "$log_file" ]]; then
    printf '\nHadolint output for %s:\n' "${DOCKERFILES[$index]}"
    cat "$log_file"
  fi
  rm -f "$log_file"
done

if (( TOTAL_FAILED > 0 )); then
  printf '\nHADOLINT FAILED\n'
  exit 1
fi

printf '\nHADOLINT PASSED\n'
