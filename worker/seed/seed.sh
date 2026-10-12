#!/usr/bin/env bash
# Writes guides for a list of places by calling the live API, slowly enough to stay under
# the AI provider's free-tier rate limit. Usage: seed.sh <api-url> <list-file>
# List lines are "Name|lat|lng", or a search query that is looked up with Nominatim.
# Prints one summary line per place and a final tally to $SEED_SUMMARY (if set).
set -u
api=$1 list=$2
ua='Roamies seeding (https://github.com/abhinandhsj93-prog/roamies)'
ok=() failed=()

while IFS= read -r line; do
  [[ -z "$line" || "$line" == \#* ]] && continue
  if [[ "$line" == *'|'* ]]; then
    IFS='|' read -r name lat lng <<< "$line"
  else
    name=$line
    hit=$(curl -sS -m 30 -A "$ua" -G 'https://nominatim.openstreetmap.org/search' \
      --data-urlencode "q=$line, Kerala, India" -d format=jsonv2 -d limit=1)
    lat=$(jq -r '.[0].lat // empty' <<< "$hit"); lng=$(jq -r '.[0].lon // empty' <<< "$hit")
    sleep 1.1 # Nominatim allows one request a second
    if [[ -z "$lat" ]]; then failed+=("$name (not found)"); echo "MISS  $name"; continue; fi
  fi

  for attempt in 1 2 3 4; do
    code=$(curl -sS -m 180 -o out.json -w '%{http_code}' "$api/place?lat=$lat&lng=$lng" || echo 000)
    # 202: someone else is writing it; 500 with 429/503: the model is busy. Wait and retry.
    if [[ $code == 202 ]] || { [[ $code == 500 ]] && grep -qE '429|503' out.json; }; then
      sleep $((attempt * 45)); continue
    fi
    break
  done
  got=$(jq -r '[.place.name // "-", (.place.seeFirst.spots|length), (.place.food|length)] | "\(.[0]) (\(.[1]) sights, \(.[2]) food)"' out.json 2>/dev/null)
  if [[ $code == 200 ]]; then ok+=("$name → $got"); echo "OK    $name → $got"
  else failed+=("$name ($code)"); echo "FAIL  $name $code $(head -c 200 out.json)"; fi
  sleep 20
done < "$list"

{
  echo "written=${#ok[@]} failed=${#failed[@]}"
  echo "failed: $(IFS=';'; echo "${failed[*]:-none}")"
  echo "written: $(IFS=';'; echo "${ok[*]:-none}")"
} | tee "${SEED_SUMMARY:-/dev/null}"
