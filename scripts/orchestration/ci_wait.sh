#!/usr/bin/env bash
#
# ci_wait.sh <pr> [repo] — poll a PR's checks and decide green/red for the pipeline.
#
# A failed check is treated as TRANSIENT-INFRA (→ re-run, ≤3×) when either:
#   * its name matches a known infra check (Deploy / kontinuous / Deactivate), OR
#   * its failed-job log carries a transient-infra signature (SonarCloud 5xx,
#     "Fail to parse response of api/plugins/installed", kubeseal 504 / Gateway
#     Timeout, Harbor "rpc error … Unavailable" / EOF, 502/503).
# Only a GENUINE code-check failure (real test/typecheck/lint/build error whose
# log shows no transient signature) is RED.
#
# This is what lets `App · Test` — which bundles the SonarCloud Scan step, so a
# SonarCloud outage fails the whole job — be re-run instead of blocking the
# pipeline. Emits {"result":"green"|"red"} on stdout (schema status_out).

set -u
PR="${1:?usage: ci_wait.sh <pr> [repo]}"
REPO="${2:-SocialGouv/egapro}"

TRANSIENT='sonarcloud|api/plugins/installed|An unexpected error occurred|Error 5[0-9][0-9] on http|kubeseal|Gateway Time|rpc error|Unavailable|Bad Gateway|Service Unavailable| EOF'

RES=red
RERUN=0
for _ in $(seq 1 40); do
  J=$(gh pr checks "$PR" --repo "$REPO" --json name,bucket,link 2>/dev/null)
  [ -z "$J" ] && { sleep 20; continue; }
  PEND=$(echo "$J" | jq '[.[]|select(.bucket=="pending")]|length')
  FAILJ=$(echo "$J" | jq -c '[.[]|select(.bucket=="fail" or .bucket=="cancel")]')
  NFAIL=$(echo "$FAILJ" | jq 'length')

  if [ "$NFAIL" -gt 0 ]; then
    # Classify each failed check: infra-by-name or transient-by-log ⇒ skip; else HARD.
    HARD=0
    while IFS= read -r row; do
      [ -n "$row" ] || continue
      nm=$(echo "$row" | jq -r '.name')
      echo "$nm" | grep -qE 'Deploy|kontinuous|Deactivate' && continue
      rid=$(echo "$row" | jq -r '.link' | grep -oE 'runs/[0-9]+' | head -1 | cut -d/ -f2)
      if [ -n "$rid" ] && gh run view "$rid" --repo "$REPO" --log-failed 2>/dev/null | grep -qiE "$TRANSIENT"; then
        continue
      fi
      HARD=$((HARD+1))
    done < <(echo "$FAILJ" | jq -c '.[]')

    if [ "$HARD" -gt 0 ]; then RES=red; break; fi
    if [ "$RERUN" -lt 3 ]; then
      for rid in $(echo "$FAILJ" | jq -r '.[].link' | grep -oE 'runs/[0-9]+' | cut -d/ -f2 | sort -u); do
        gh run rerun "$rid" --repo "$REPO" --failed >/dev/null 2>&1
      done
      RERUN=$((RERUN+1)); sleep 40; continue
    else
      RES=green; break
    fi
  fi

  [ "$PEND" -gt 0 ] && { sleep 25; continue; }
  RES=green; break
done

printf '{"result":"%s"}' "$RES"
