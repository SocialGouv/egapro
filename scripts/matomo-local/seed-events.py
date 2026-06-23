#!/usr/bin/env python3
"""Seed synthetic Matomo tracking events for local egapro testing.

Runs as the one-shot `matomo-seed` service. It fires events through Matomo's
Bulk Tracking API so the /admin/stats widgets show realistic data:

  * the three funnels (declaration / cse_opinion / compliance_path) with
    drop-off, carrying the campaign_year (dim 1) + workforce_range (dim 2)
    dimensions the Reporting API segments on;
  * indicator-model usage (document category: imports, failures by enumerated
    error type, import durations);
  * help-link clicks (help category, by slug);
  * outbound consultations (search category) for the device-split widget.

Events are backdated into the two most recent campaign years and sent with
varied User-Agents (desktop / smartphone / tablet) — both require token_auth,
read from /out/token (written by cnil-setup.py). Idempotent: a year that
already has a `declaration` category is skipped. Standard library only.
"""

import json
import os
import random
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

MATOMO_URL = os.environ.get("MATOMO_URL", "http://matomo").rstrip("/")
SITE_ID = os.environ.get("MATOMO_SITE_ID", "1")
TOKEN_PATH = "/out/token"
SITE_URL = os.environ.get("MATOMO_SITE_URL", "http://localhost:3000")

# Taxonomy — mirrors packages/app/src/modules/analytics/shared/events.ts.
CAT_DECLARATION = "declaration"
CAT_CSE = "cse_opinion"
CAT_COMPLIANCE = "compliance_path"
CAT_SEARCH = "search"
CAT_HELP = "help"
CAT_DOCUMENT = "document"

A_FUNNEL_START = "funnel_start"
A_STEP_COMPLETE = "step_complete"
A_FUNNEL_COMPLETE = "funnel_complete"
A_CONSULTATION = "consultation_outbound"
A_HELP_CLICK = "help_link_click"
A_CAT_IMPORT = "category_import"
A_CAT_FAILURE = "category_import_failure"
A_CAT_DURATION = "category_import_duration"

DIM_YEAR = 1
DIM_SIZE = 2
SIZE_RANGES = ["<50", "50-99", "100-149", "150-249", "250+"]

USER_AGENTS = {
    "desktop": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "smartphone": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "tablet": "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
}
# Weighted toward desktop, with a meaningful mobile/tablet share.
DEVICE_WEIGHTS = [("desktop", 6), ("smartphone", 3), ("tablet", 1)]

# Help-link slugs — must match the app's TrackedLink instrumentation
# (docs/plan-de-tracking.md); the /admin/stats widget maps them to labels.
HELP_SLUGS = [
    "cse_models",
    "objective_criteria",
    "corrective_actions",
    "joint_evaluation",
]
# Enumerated import-error types emitted by category_import_failure.
IMPORT_ERROR_TYPES = ["missing-columns", "invalid-value", "empty-file"]

# Deterministic-ish per run; vary by index so reruns differ without Math.random
# concerns. (random is available in the real container runtime.)
rng = random.Random(20260622)


def log(msg):
    print(f"[matomo-seed] {msg}", flush=True)


def read_token():
    if not os.path.exists(TOKEN_PATH):
        return None
    with open(TOKEN_PATH, encoding="utf-8") as fh:
        token = fh.read().strip()
    return token or None


def visitor_id():
    return "".join(rng.choice("0123456789abcdef") for _ in range(16))


def pick_device():
    pool = [d for d, w in DEVICE_WEIGHTS for _ in range(w)]
    return rng.choice(pool)


def year_timestamp(year):
    """A random unix timestamp inside `year` (capped at now for the current one)."""
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    if end > now:
        end = now
    span = max(int(end.timestamp()) - int(start.timestamp()), 1)
    return int(start.timestamp()) + rng.randint(0, span)


def build_request(token, *, vid, cat, action, name=None, value=None, year=None,
                  size=None, ua_key=None, cdt=None):
    params = {
        "idsite": SITE_ID,
        "rec": "1",
        "apiv": "1",
        "_id": vid,
        "url": f"{SITE_URL}/seed",
        "e_c": cat,
        "e_a": action,
        "send_image": "0",
        "rand": str(rng.randint(1, 10**9)),
    }
    if name is not None:
        params["e_n"] = name
    if value is not None:
        params["e_v"] = str(value)
    if year is not None:
        params[f"dimension{DIM_YEAR}"] = str(year)
    if size is not None:
        params[f"dimension{DIM_SIZE}"] = size
    if ua_key is not None:
        params["ua"] = USER_AGENTS[ua_key]
    if cdt is not None:
        params["cdt"] = str(cdt)
    if token:
        params["token_auth"] = token
    return "?" + urllib.parse.urlencode(params)


def send_bulk(token, requests):
    """POST a batch of tracking requests via the Bulk Tracking API."""
    payload = {"requests": requests}
    if token:
        payload["token_auth"] = token
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{MATOMO_URL}/matomo.php",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        body = resp.read().decode("utf-8", "replace")
    try:
        parsed = json.loads(body)
        if parsed.get("status") != "success":
            log(f"WARN bulk response: {body[:200]}")
    except json.JSONDecodeError:
        log(f"WARN non-JSON bulk response: {body[:200]}")


def api(method, params, token):
    fields = {"module": "API", "method": method, "format": "JSON",
              "token_auth": token or "anonymous"}
    fields.update(params)
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(f"{MATOMO_URL}/index.php", data=data)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except (urllib.error.HTTPError, json.JSONDecodeError):
        return None


def already_seeded(token, year):
    result = api(
        "Events.getCategory",
        {"idSite": SITE_ID, "period": "year", "date": f"{year}-06-15",
         "segment": f"dimension{DIM_YEAR}=={year}", "filter_limit": "-1"},
        token,
    )
    if isinstance(result, list):
        return any(row.get("label") == CAT_DECLARATION for row in result)
    return False


# Funnel definitions: (category, step count, visitor count, segment-by-size).
FUNNELS = [
    (CAT_DECLARATION, 5, 60, True),
    (CAT_CSE, 1, 25, False),
    (CAT_COMPLIANCE, 2, 30, False),
]


def seed_funnel(requests, token, category, steps, visitors, with_size, year):
    for _ in range(visitors):
        vid = visitor_id()
        ua = pick_device()
        size = rng.choice(SIZE_RANGES) if with_size else None
        cdt = year_timestamp(year)
        common = dict(vid=vid, cat=category, year=year, size=size,
                      ua_key=ua, cdt=cdt)
        requests.append(build_request(token, action=A_FUNNEL_START, **common))
        # How far this visitor gets (geometric-ish drop-off).
        reached = steps
        while reached > 0 and rng.random() < 0.25:
            reached -= 1
        for step in range(1, reached + 1):
            requests.append(
                build_request(token, action=A_STEP_COMPLETE,
                              name=f"step_{step}", **common)
            )
        if reached == steps:
            requests.append(
                build_request(token, action=A_FUNNEL_COMPLETE, **common)
            )


def seed_behaviour(requests, token, year):
    # Indicator-model usage (document category, no custom dimensions). Names and
    # values mirror the app taxonomy: a successful import carries the category
    # count as value (no name), a failure carries an enumerated error type as
    # name, and a fill-duration carries seconds as value (no name).
    for _ in range(30):
        vid = visitor_id()
        cdt = year_timestamp(year)
        roll = rng.random()
        if roll < 0.55:
            action, name, value = A_CAT_IMPORT, None, rng.randint(3, 12)
        elif roll < 0.75:
            action, name, value = A_CAT_FAILURE, rng.choice(IMPORT_ERROR_TYPES), None
        else:
            action, name, value = A_CAT_DURATION, None, rng.randint(30, 600)
        requests.append(
            build_request(token, vid=vid, cat=CAT_DOCUMENT, action=action,
                          name=name, value=value, cdt=cdt,
                          ua_key=pick_device())
        )
    # Help-link clicks (help category, no custom dimensions) — name = slug.
    for _ in range(20):
        requests.append(
            build_request(token, vid=visitor_id(), cat=CAT_HELP,
                          action=A_HELP_CLICK, name=rng.choice(HELP_SLUGS),
                          cdt=year_timestamp(year), ua_key=pick_device())
        )
    # Outbound consultations (search category) — feeds the device-split widget.
    for _ in range(20):
        requests.append(
            build_request(token, vid=visitor_id(), cat=CAT_SEARCH,
                          action=A_CONSULTATION, cdt=year_timestamp(year),
                          ua_key=pick_device())
        )


def warm_archives(token, years):
    """Invalidate + recompute year archives so backdated events show up."""
    dates = ",".join(f"{y}-06-15" for y in years)
    api("CoreAdminHome.invalidateArchivedReports",
        {"idSites": SITE_ID, "dates": dates, "period": "year"}, token)
    for y in years:
        api("VisitsSummary.get",
            {"idSite": SITE_ID, "period": "year", "date": f"{y}-06-15"}, token)


def main():
    token = read_token()
    if not token:
        log("WARN: no token at /out/token — device-split + backdating disabled")
    this_year = datetime.now(timezone.utc).year
    target_years = [this_year, this_year - 1]
    seeded = []
    for year in target_years:
        if token and already_seeded(token, year):
            log(f"year {year} already seeded — skipping")
            continue
        requests = []
        for category, steps, visitors, with_size in FUNNELS:
            seed_funnel(requests, token, category, steps, visitors,
                        with_size, year)
        seed_behaviour(requests, token, year)
        log(f"seeding {len(requests)} events for {year}…")
        # Bulk API caps payload size; send in batches.
        for i in range(0, len(requests), 200):
            send_bulk(token, requests[i:i + 200])
        seeded.append(year)
    if seeded and token:
        warm_archives(token, seeded)
        log(f"warmed archives for {seeded}")
    log("seeding complete")


if __name__ == "__main__":
    main()
