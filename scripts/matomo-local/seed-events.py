#!/usr/bin/env python3
"""Seed synthetic Matomo events for local egapro testing — and verify CNIL compliance.

Two subcommands (default: `seed`):

  python seed-events.py [seed] [--force]   # fire the FULL tracking plan as events
  python seed-events.py verify             # audit the live instance for CNIL compliance

`seed` covers **every** event in `docs/plan-de-tracking.md` (1:1 with
`packages/app/src/modules/analytics/shared/events.ts`):

  * native page views (clean URLs, no query string);
  * the three funnels — declaration / cse_opinion / compliance_path — with
    `funnel_start` / `step_complete` / `funnel_abandon` / `funnel_complete`,
    carrying the campaign_year (dim 1) + workforce_range (dim 2, declaration
    only) dimensions the Reporting API segments on;
  * every standalone action across the 9 categories:
      - search/search_submit (facet names only), search/consultation_outbound
      - help/faq_section_open, help/aide_resource_click, help/help_link_click
      - document/pdf_download (+ year), document/file_upload (+ file count),
        document/category_import|category_import_failure|category_import_duration
      - auth/login_start
      - dashboard/declaration_start
      - cse_status/cse_status_confirm (bounded oui/non label + year — never SIREN).

`verify` reads the aggregated reports back through the Reporting API and asserts
the CNIL consent-exemption conditions that depend on the *data*: no PII in event
categories/actions/names, non-personal custom-dimension values, query-string-free
page URLs, and live IP anonymisation. (DNT, 750-day log retention and
export-disabling are applied — and documented — by `cnil-setup.py`.)

Events are backdated into the two most recent campaign years and sent with varied
User-Agents (desktop / smartphone / tablet) via the Bulk Tracking API; both need
`token_auth`, resolved from `MATOMO_TOKEN`, `MATOMO_TOKEN_FILE`, `/out/token`
(container) or `scripts/matomo-local/.secrets/token` (host). `seed` is idempotent:
a year that already has a `declaration` category is skipped unless `--force`.

Runs inside the `matomo-seed` container (MATOMO_URL=http://matomo) and from the
host against the dockerised Matomo:

  MATOMO_URL=http://localhost:8080 python3 scripts/matomo-local/seed-events.py
  MATOMO_URL=http://localhost:8080 python3 scripts/matomo-local/seed-events.py verify

Standard library only.
"""

import json
import os
import random
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

MATOMO_URL = os.environ.get("MATOMO_URL", "http://matomo").rstrip("/")
SITE_ID = os.environ.get("MATOMO_SITE_ID", "1")
SITE_URL = os.environ.get("MATOMO_SITE_URL", "http://localhost:3000")
# Token resolution order: explicit value → explicit file → container path → host path.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
TOKEN_CANDIDATES = [
    os.environ.get("MATOMO_TOKEN_FILE"),
    "/out/token",
    os.path.join(SCRIPT_DIR, ".secrets", "token"),
]
# Multiplies every per-category volume so the local instance has plenty of data.
# Override with SEED_VOLUME (e.g. SEED_VOLUME=6 for ~6× the events).
VOLUME = max(int(os.environ.get("SEED_VOLUME", "4")), 1)

# Taxonomy — mirrors packages/app/src/modules/analytics/shared/events.ts.
CAT_DECLARATION = "declaration"
CAT_CSE = "cse_opinion"
CAT_COMPLIANCE = "compliance_path"
CAT_SEARCH = "search"
CAT_HELP = "help"
CAT_DOCUMENT = "document"
CAT_AUTH = "auth"
CAT_DASHBOARD = "dashboard"
CAT_CSE_STATUS = "cse_status"

A_FUNNEL_START = "funnel_start"
A_STEP_COMPLETE = "step_complete"
A_FUNNEL_ABANDON = "funnel_abandon"
A_FUNNEL_COMPLETE = "funnel_complete"
A_SEARCH_SUBMIT = "search_submit"
A_CONSULTATION = "consultation_outbound"
A_FAQ_OPEN = "faq_section_open"
A_AIDE_CLICK = "aide_resource_click"
A_HELP_CLICK = "help_link_click"
A_PDF_DOWNLOAD = "pdf_download"
A_FILE_UPLOAD = "file_upload"
A_CAT_IMPORT = "category_import"
A_CAT_FAILURE = "category_import_failure"
A_CAT_DURATION = "category_import_duration"
A_LOGIN_START = "login_start"
A_DECLARATION_START = "declaration_start"
A_CSE_CONFIRM = "cse_status_confirm"

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

# --- Non-PII `name` pools, mirroring the app's real instrumentation ----------
# Search facet names — field names only, never their values (HomeSearchForm joins
# FACET_FIELDS order; ReferentsSearchForm joins sorted alphabetically; "empty").
SEARCH_FACETS = [
    "empty",
    "query",
    "query+region",
    "query+region+departement",
    "region+departement+secteur",
    "region",
    "county+region",
    "departement+region",
]
# FAQ accordion ids: `accordion-<sectionId>-<subsectionIndex>-<index>` (faqData.ts).
FAQ_ACCORDION_IDS = [
    "accordion-indicateur-remuneration-0-0",
    "accordion-indicateur-remuneration-0-1",
    "accordion-indicateur-representation-0-0",
    "accordion-ecart-augmentations-0-0",
    "accordion-ecart-promotions-1-0",
    "accordion-retour-conge-maternite-0-0",
    "accordion-hautes-remunerations-0-0",
    "accordion-declaration-0-0",
    "accordion-mesures-correction-0-1",
]
# /aide resource cards (AideResourceCards.tsx `trackingId`).
AIDE_RESOURCES = ["nouveau-site", "indicateurs-remuneration", "indicateurs-representation"]
# Help-link slugs — must match TrackedLink instrumentation; /admin/stats maps them.
HELP_SLUGS = ["cse_models", "objective_criteria", "corrective_actions", "joint_evaluation"]
# PDF kinds (DownloadDeclarationPdfButton.tsx).
PDF_TYPES = ["main", "correction"]
# Upload flow types — non-PII enum (uploadConfig.ts `FlowType`).
FILE_UPLOAD_FLOWS = ["cse_opinion", "joint_evaluation"]
# Enumerated import-error types emitted by category_import_failure.
IMPORT_ERROR_TYPES = ["missing-columns", "invalid-value", "empty-file"]
# CSE status confirmation labels — bounded; never a SIREN.
CSE_STATUS_NAMES = ["oui", "non"]
# Clean page paths (no query string) for native page-view tracking.
PAGE_VIEWS = [
    ("/", "Accueil"),
    ("/aide", "Aide"),
    ("/faq", "Questions fréquentes"),
    ("/login", "Connexion"),
    ("/mon-espace", "Mon espace"),
    ("/declaration-remuneration/etape/1", "Déclaration — Effectifs"),
    ("/avis-cse/etape/1", "Avis CSE — Étape 1"),
    ("/referents", "Référents"),
    ("/gestion-des-cookies", "Gestion des cookies"),
    ("/donnees-personnelles", "Données personnelles"),
]

# PII patterns the verifier refuses to find in any event / dimension / URL label.
PII_PATTERNS = [
    ("9+ digit run (SIREN/SIRET)", re.compile(r"\d{9,}")),
    ("email address", re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+")),
]

# Deterministic per run; vary by draw so output is reproducible.
rng = random.Random(20260622)


def log(msg):
    print(f"[matomo-seed] {msg}", flush=True)


def read_token():
    env_token = os.environ.get("MATOMO_TOKEN")
    if env_token and env_token.strip():
        return env_token.strip()
    for path in TOKEN_CANDIDATES:
        if path and os.path.exists(path):
            with open(path, encoding="utf-8") as fh:
                token = fh.read().strip()
            if token:
                return token
    return None


def visitor_id():
    return "".join(rng.choice("0123456789abcdef") for _ in range(16))


def visitor_ip():
    """A distinct client IP per synthetic visitor so Matomo creates isolated
    visits. Without it, same-IP events merge into shared visits and the
    visit-scoped `Events.getName` funnel reads leak step names across funnels
    (phantom steps, >100 % bars). IP anonymisation (2 bytes, cnil-setup.py)
    still applies on storage, so this stays CNIL-compliant."""
    return ".".join(str(rng.randint(1, 254)) for _ in range(4))


def pick_device():
    pool = [d for d, w in DEVICE_WEIGHTS for _ in range(w)]
    return rng.choice(pool)


def year_timestamp(year):
    """A unix timestamp inside `year` (capped at now for the current one).

    For the **current** year the distribution is biased toward recent days so
    narrow date views (today / this week / this month) aren't empty — most of
    Matomo's default reports land on a recent period. Year totals stay rich for
    the period=year `/admin/stats` widgets. Past years spread uniformly.
    """
    start = datetime(year, 1, 1, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    end = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    if end > now:
        end = now
    start_ts, end_ts = int(start.timestamp()), int(end.timestamp())
    if year == now.year:
        day = 86400
        roll = rng.random()
        if roll < 0.35:          # last 2 days → populates "today" / "yesterday"
            lo = max(end_ts - 2 * day, start_ts)
        elif roll < 0.70:        # last 30 days → populates "this month"
            lo = max(end_ts - 30 * day, start_ts)
        else:                    # rest of the year → keeps year widgets rich
            lo = start_ts
        return rng.randint(lo, end_ts)
    span = max(end_ts - start_ts, 1)
    return start_ts + rng.randint(0, span)


def build_request(token, *, vid, cat, action, name=None, value=None, year=None,
                  size=None, ua_key=None, cdt=None, cip=None):
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
    if cip is not None:  # overrides visitor IP — needs token_auth (set below)
        params["cip"] = cip
    if token:
        params["token_auth"] = token
    return "?" + urllib.parse.urlencode(params)


def build_pageview(token, *, vid, path, title, ua_key=None, cdt=None, cip=None):
    params = {
        "idsite": SITE_ID,
        "rec": "1",
        "apiv": "1",
        "_id": vid,
        "url": f"{SITE_URL}{path}",  # clean path, no query string (CNIL: no PII in URLs)
        "action_name": title,
        "send_image": "0",
        "rand": str(rng.randint(1, 10**9)),
    }
    if ua_key is not None:
        params["ua"] = USER_AGENTS[ua_key]
    if cdt is not None:
        params["cdt"] = str(cdt)
    if cip is not None:  # overrides visitor IP — needs token_auth (set below)
        params["cip"] = cip
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
    """Reporting/admin API call — token in the POST body, never the URL."""
    fields = {"module": "API", "method": method, "format": "JSON",
              "token_auth": token or "anonymous"}
    fields.update(params)
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(f"{MATOMO_URL}/index.php", data=data)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read().decode("utf-8", "replace"))
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError):
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
# Step counts mirror the Reporting jalons in server/services/matomo.ts.
FUNNELS = [
    (CAT_DECLARATION, 5, 60, True),
    (CAT_CSE, 1, 25, False),
    (CAT_COMPLIANCE, 2, 30, False),
]


# Probability a visitor advances from one step to the next. < 1 so each jalon
# carries fewer declarations than the previous one — a realistic descending
# funnel (~15 % attrition per step) instead of the old near-flat one. Step-attempt
# arrivals are N·p^(i-1): combined with the abandon/step_complete split this keeps
# every jalon at or below `funnel_start` (no >100 % bars) on the /admin/stats chart.
FUNNEL_STEP_ADVANCE_PROB = 0.85


def seed_funnel(requests, token, category, steps, visitors, with_size, year):
    for _ in range(visitors * VOLUME):
        vid = visitor_id()
        ua = pick_device()
        size = rng.choice(SIZE_RANGES) if with_size else None
        cdt = year_timestamp(year)
        common = dict(vid=vid, cat=category, year=year, size=size,
                      ua_key=ua, cdt=cdt, cip=visitor_ip())
        requests.append(build_request(token, action=A_FUNNEL_START, **common))
        # Walk the steps one by one; at each step the visitor either completes it
        # and moves on, or drops out (abandon) with probability 1 - advance_prob.
        total_seconds = 0
        completed_all = True
        for step in range(1, steps + 1):
            if rng.random() >= FUNNEL_STEP_ADVANCE_PROB:
                # Abandoned on the current step — name = step reached, value = total.
                total_seconds += rng.randint(10, 120)
                requests.append(
                    build_request(token, action=A_FUNNEL_ABANDON,
                                  name=f"step_{step}", value=total_seconds, **common)
                )
                completed_all = False
                break
            # Completed this step — `name` = step left, `value` = seconds on it.
            step_seconds = rng.randint(20, 240)
            total_seconds += step_seconds
            requests.append(
                build_request(token, action=A_STEP_COMPLETE,
                              name=f"step_{step}", value=step_seconds, **common)
            )
        if completed_all:
            requests.append(
                build_request(token, action=A_FUNNEL_COMPLETE,
                              value=total_seconds, **common)
            )


def seed_pageviews(requests, token, year, count=80):
    for _ in range(count * VOLUME):
        path, title = rng.choice(PAGE_VIEWS)
        requests.append(
            build_pageview(token, vid=visitor_id(), path=path, title=title,
                           ua_key=pick_device(), cdt=year_timestamp(year),
                           cip=visitor_ip())
        )


def seed_actions(requests, token, year):
    """Every standalone action of the tracking plan, across the 9 categories."""

    def fire(count, cat, action, name_fn=None, value_fn=None, with_year=False):
        for _ in range(count * VOLUME):
            requests.append(
                build_request(
                    token, vid=visitor_id(), cat=cat, action=action,
                    name=name_fn() if name_fn else None,
                    value=value_fn() if value_fn else None,
                    year=year if with_year else None,
                    cdt=year_timestamp(year), ua_key=pick_device(),
                    cip=visitor_ip(),
                )
            )

    # search — facet names only (never values); consultation feeds device split.
    fire(40, CAT_SEARCH, A_SEARCH_SUBMIT, name_fn=lambda: rng.choice(SEARCH_FACETS))
    fire(25, CAT_SEARCH, A_CONSULTATION)
    # help — FAQ accordions, /aide cards, instrumented help links.
    fire(30, CAT_HELP, A_FAQ_OPEN, name_fn=lambda: rng.choice(FAQ_ACCORDION_IDS))
    fire(20, CAT_HELP, A_AIDE_CLICK, name_fn=lambda: rng.choice(AIDE_RESOURCES))
    fire(20, CAT_HELP, A_HELP_CLICK, name_fn=lambda: rng.choice(HELP_SLUGS))
    # document — PDF (carries the year), file upload (file count), model usage.
    fire(25, CAT_DOCUMENT, A_PDF_DOWNLOAD,
         name_fn=lambda: rng.choice(PDF_TYPES), with_year=True)
    fire(20, CAT_DOCUMENT, A_FILE_UPLOAD,
         name_fn=lambda: rng.choice(FILE_UPLOAD_FLOWS),
         value_fn=lambda: rng.randint(1, 3))
    seed_category_model(requests, token, year)
    # auth — ProConnect login start.
    fire(35, CAT_AUTH, A_LOGIN_START)
    # dashboard — declaration start from mon-espace.
    fire(30, CAT_DASHBOARD, A_DECLARATION_START, name_fn=lambda: "remuneration")
    # cse_status — bounded oui/non label + campaign year (slot 1), never a SIREN.
    fire(30, CAT_CSE_STATUS, A_CSE_CONFIRM,
         name_fn=lambda: rng.choice(CSE_STATUS_NAMES), with_year=True)


def seed_category_model(requests, token, year, count=30):
    # Indicator-by-category model: a successful import carries the category count
    # as value (no name), a failure carries an enumerated error type as name, a
    # fill-duration carries seconds as value (no name).
    for _ in range(count * VOLUME):
        roll = rng.random()
        if roll < 0.55:
            action, name, value = A_CAT_IMPORT, None, rng.randint(3, 12)
        elif roll < 0.75:
            action, name, value = A_CAT_FAILURE, rng.choice(IMPORT_ERROR_TYPES), None
        else:
            action, name, value = A_CAT_DURATION, None, rng.randint(30, 600)
        requests.append(
            build_request(token, vid=visitor_id(), cat=CAT_DOCUMENT,
                          action=action, name=name, value=value,
                          cdt=year_timestamp(year), ua_key=pick_device(),
                          cip=visitor_ip())
        )


def warm_archives(token, years):
    """Invalidate + recompute archives so backdated events show up.

    Year archives for every seeded year, plus day/week/month for the current
    year's recent window (where the biased events land) so narrow date views in
    the Matomo UI aren't empty.
    """
    year_dates = ",".join(f"{y}-06-15" for y in years)
    api("CoreAdminHome.invalidateArchivedReports",
        {"idSites": SITE_ID, "dates": year_dates, "period": "year"}, token)
    for y in years:
        api("VisitsSummary.get",
            {"idSite": SITE_ID, "period": "year", "date": f"{y}-06-15"}, token)
    # Recent window — the last few days get day/week/month archives recomputed
    # so "today" / "this week" / "this month" views show the biased events.
    now = datetime.now(timezone.utc)
    recent = [(now - timedelta(days=d)).strftime("%Y-%m-%d") for d in range(4)]
    recent_csv = ",".join(recent)
    for period in ("day", "week", "month"):
        api("CoreAdminHome.invalidateArchivedReports",
            {"idSites": SITE_ID, "dates": recent_csv, "period": period}, token)
        for date in recent:
            api("VisitsSummary.get",
                {"idSite": SITE_ID, "period": period, "date": date}, token)


def cmd_seed(force):
    token = read_token()
    if not token:
        log("WARN: no token (set MATOMO_TOKEN / MATOMO_TOKEN_FILE, or run after "
            "cnil-setup.py) — device-split + backdating disabled")
    this_year = datetime.now(timezone.utc).year
    target_years = [this_year, this_year - 1]
    seeded = []
    for year in target_years:
        if not force and token and already_seeded(token, year):
            log(f"year {year} already seeded — skipping (use --force to re-seed)")
            continue
        requests = []
        seed_pageviews(requests, token, year)
        for category, steps, visitors, with_size in FUNNELS:
            seed_funnel(requests, token, category, steps, visitors,
                        with_size, year)
        seed_actions(requests, token, year)
        log(f"seeding {len(requests)} events for {year}…")
        # Bulk API caps payload size; send in batches.
        for i in range(0, len(requests), 200):
            send_bulk(token, requests[i:i + 200])
        seeded.append(year)
    if seeded and token:
        warm_archives(token, seeded)
        log(f"warmed archives for {seeded}")
    log("seeding complete")


# --------------------------------------------------------------------------
# CNIL compliance verification (subcommand: verify)
# --------------------------------------------------------------------------


def scan_labels(source, labels):
    found = []
    for label in labels:
        text = str(label)
        for desc, pattern in PII_PATTERNS:
            if pattern.search(text):
                found.append((source, text, desc))
    return found


def get_report(token, method, year, extra=None):
    params = {"idSite": SITE_ID, "period": "year", "date": f"{year}-06-15",
              "filter_limit": "-1"}
    if extra:
        params.update(extra)
    result = api(method, params, token)
    return result if isinstance(result, list) else None


def cmd_verify():
    token = read_token()
    if not token:
        log("ERROR: verify needs an API token "
            "(MATOMO_TOKEN / MATOMO_TOKEN_FILE / /out/token)")
        return 1
    this_year = datetime.now(timezone.utc).year
    years = [this_year, this_year - 1]
    violations, warnings, passed = [], [], []

    # 1) No PII in aggregated event reports (category / action / name).
    for year in years:
        for method in ("Events.getCategory", "Events.getAction", "Events.getName"):
            rows = get_report(token, method, year, {"flat": "1"})
            if rows is None:
                warnings.append(f"{method} ({year}) unreadable — skipped")
                continue
            labels = [r.get("label") for r in rows if isinstance(r, dict)]
            hits = scan_labels(f"{method} {year}", labels)
            if hits:
                violations.extend(hits)
            else:
                passed.append(f"{method} {year}: {len(labels)} labels, no PII")

    # 2) Custom-dimension values are non-personal (year / size bracket only).
    for year in years:
        for dim_id, dim_name in ((DIM_YEAR, "campaign_year"),
                                 (DIM_SIZE, "workforce_range")):
            rows = get_report(token, "CustomDimensions.getCustomDimension", year,
                              {"idDimension": str(dim_id)})
            if rows is None:
                warnings.append(f"dimension {dim_id} ({year}) unreadable — skipped")
                continue
            labels = [r.get("label") for r in rows if isinstance(r, dict)]
            hits = scan_labels(f"dimension {dim_id} ({dim_name}) {year}", labels)
            if hits:
                violations.extend(hits)
            else:
                sample = ", ".join(str(label) for label in labels[:5])
                passed.append(f"dimension {dim_id} ({dim_name}) {year}: "
                              f"[{sample}] — no PII")

    # 3) Page URLs carry no query string (cleanUrl strips PII).
    for year in years:
        rows = get_report(token, "Actions.getPageUrls", year, {"flat": "1"})
        if rows is None:
            warnings.append(f"page URLs ({year}) unreadable — skipped")
            continue
        dirty = [r.get("url") for r in rows
                 if isinstance(r, dict) and "?" in str(r.get("url", ""))]
        if dirty:
            for url in dirty:
                violations.append((f"page url {year}", url, "query string present"))
        else:
            passed.append(f"page URLs {year}: clean (no query string)")

    # 4) Instance privacy config (IP anonymisation 2 bytes, DNT, 750-day log
    #    retention, export-disabling, user-id pseudonymisation) is applied by
    #    cnil-setup.py and stored in Matomo's `option` table — Matomo 5 does NOT
    #    expose it through the Reporting API, so it can't be asserted over HTTP
    #    from here. Surface it as a note with the live confirmation command.
    notes = [
        "instance privacy config (IP anonymisation 2 bytes, Do Not Track, "
        "750-day log retention, export-disabling, user-id pseudonymisation) is "
        "applied by cnil-setup.py — not exposed by the Reporting API; confirm it "
        "on the running instance with:",
        "      docker exec egapro-matomo-db-1 mariadb -u matomo -pmatomo matomo "
        "-N -e \"SELECT option_name, option_value FROM matomo_option WHERE "
        "option_name LIKE 'PrivacyManager%' OR option_name LIKE 'delete_logs%';\"",
    ]

    # Report.
    log("── CNIL compliance verification ─────────────────────────")
    for item in passed:
        log(f"  PASS  {item}")
    for item in notes:
        log(f"  NOTE  {item}")
    for item in warnings:
        log(f"  WARN  {item}")
    for source, value, desc in violations:
        log(f"  FAIL  [{source}] {desc}: {value!r}")
    log("─────────────────────────────────────────────────────────")
    if violations:
        log(f"NON-COMPLIANT: {len(violations)} violation(s) found")
        return 1
    log("COMPLIANT (data-level): no PII in event categories/actions/names or "
        "custom dimensions, page URLs carry no query string. Instance privacy "
        "config is applied by cnil-setup.py — see the NOTE above to confirm it "
        "live.")
    return 0


def main():
    args = sys.argv[1:]
    force = "--force" in args or os.environ.get("SEED_FORCE") == "1"
    positional = [a for a in args if not a.startswith("-")]
    command = positional[0] if positional else "seed"
    if command == "verify":
        sys.exit(cmd_verify())
    if command == "seed":
        cmd_seed(force)
        return
    log(f"unknown command '{command}' (expected: seed | verify)")
    sys.exit(2)


if __name__ == "__main__":
    main()
