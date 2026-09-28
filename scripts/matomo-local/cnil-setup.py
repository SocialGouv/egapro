#!/usr/bin/env python3
"""Provision a local Matomo instance for egapro end-to-end testing.

Runs as the one-shot `matomo-init` service in docker-compose.yml. It is
idempotent — safe to re-run on every `docker compose up`:

  1. installs Matomo if the data volume is empty (drives the web installer);
  2. registers the local trusted hosts (localhost:8080) in config.ini.php;
  3. ensures the "Egapro Local" measurable site exists (idSite 1);
  4. ensures the campaign_year (dim 1) and workforce_range (dim 2) action-scoped
     custom dimensions exist — these back the Reporting-API widgets;
  5. ensures an app API token exists and writes it to /out/token for the app;
  6. applies the CNIL privacy configuration (IP anonymisation, DoNotTrack, log
     retention) mirroring the production exemption settings.

Standard library only — the container has no pip step, matching the image's
default `python /setup/cnil-setup.py` command.
"""

import http.cookiejar
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

MATOMO_URL = os.environ.get("MATOMO_URL", "http://matomo").rstrip("/")
SU_LOGIN = os.environ.get("MATOMO_SU_LOGIN", "admin")
SU_PASSWORD = os.environ.get("MATOMO_SU_PASSWORD", "changeme123")
SU_EMAIL = os.environ.get("MATOMO_SU_EMAIL", "admin@example.com")
SITE_NAME = os.environ.get("MATOMO_SITE_NAME", "Egapro Local")
SITE_URL = os.environ.get("MATOMO_SITE_URL", "http://localhost:3000")
DB_HOST = os.environ.get("MATOMO_DB_HOST", "matomo-db")
DB_NAME = os.environ.get("MATOMO_DB_NAME", "matomo")
DB_USER = os.environ.get("MATOMO_DB_USER", "matomo")
DB_PASSWORD = os.environ.get("MATOMO_DB_PASSWORD", "matomo")
TRUSTED_HOSTS = [
    h.strip()
    for h in os.environ.get(
        "MATOMO_TRUSTED_HOSTS", "matomo,localhost:8080,127.0.0.1:8080"
    ).split(",")
    if h.strip()
]
CONFIG_PATH = "/matomo/config/config.ini.php"
OUT_DIR = "/out"
TOKEN_DESCRIPTION = "egapro-local"

# campaign_year / workforce_range must be created in this order on a fresh site
# so they land on action-scope slots 1 and 2 (the indices the app queries).
CUSTOM_DIMENSIONS = ["campaign_year", "workforce_range"]

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))


def log(msg):
    print(f"[matomo-init] {msg}", flush=True)


def fail(msg):
    log(f"ERROR: {msg}")
    sys.exit(1)


def http_get(url):
    req = urllib.request.Request(
        url, headers={"Accept": "text/html,application/json"}
    )
    with opener.open(req, timeout=30) as resp:
        return resp.read().decode("utf-8", "replace")


def http_post(url, fields):
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with opener.open(req, timeout=90) as resp:
        return resp.read().decode("utf-8", "replace")


class _FormParser(HTMLParser):
    """Captures the first form's action and every input/select name=value."""

    def __init__(self):
        super().__init__()
        self.action = None
        self.fields = {}
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        if tag == "form" and self.action is None:
            self.action = a.get("action", "")
            self._depth = 1
        elif self._depth and tag in ("input", "select", "textarea"):
            name = a.get("name")
            if name:
                self.fields.setdefault(name, a.get("value", ""))

    def handle_endtag(self, tag):
        if tag == "form" and self._depth:
            self._depth = 0


def parse_form(html):
    p = _FormParser()
    p.feed(html)
    return p.fields


# --------------------------------------------------------------------------
# Readiness + install detection
# --------------------------------------------------------------------------


def wait_for_matomo():
    for attempt in range(60):
        try:
            http_get(f"{MATOMO_URL}/index.php")
            log("Matomo HTTP is up")
            return
        except Exception as exc:  # noqa: BLE001 - boot races are expected
            if attempt % 5 == 0:
                log(f"waiting for Matomo… ({exc})")
            time.sleep(2)
    fail("Matomo did not become reachable")


def is_installed():
    html = http_get(f"{MATOMO_URL}/index.php")
    # The installer wizard advertises module=Installation; an installed instance
    # redirects to Login / shows the dashboard.
    return "module=Installation" not in html and "Installation" not in html[:4000]


# --------------------------------------------------------------------------
# Installer
# --------------------------------------------------------------------------


def step_url(action):
    return f"{MATOMO_URL}/index.php?action={action}&module=Installation"


def install():
    log("installing Matomo via the web installer…")
    # welcome + systemCheck just establish the session / pass checks.
    http_get(step_url("welcome"))
    http_get(step_url("systemCheck"))

    # databaseSetup — the form carries no CSRF nonce; send the exact field set
    # (the `schema` select must be Mariadb for the mariadb image, and `type` is
    # the storage engine). adapter PDO\MYSQL matches the installed PluginsList.
    db_url = step_url("databaseSetup")
    http_get(db_url)
    http_post(
        db_url,
        {
            "type": "InnoDB",
            "host": DB_HOST,
            "username": DB_USER,
            "password": DB_PASSWORD,
            "dbname": DB_NAME,
            "tables_prefix": "matomo_",
            "adapter": "PDO\\MYSQL",
            "schema": "Mariadb",
            "submit": "Next »",
        },
    )

    # tablesCreation creates the schema.
    http_get(step_url("tablesCreation"))

    # setupSuperUser.
    su_url = step_url("setupSuperUser")
    fields = parse_form(http_get(su_url))
    fields.update(
        {
            "login": SU_LOGIN,
            "password": SU_PASSWORD,
            "password_bis": SU_PASSWORD,
            "email": SU_EMAIL,
            "subscribe_newsletter_piwikorg": "0",
            "subscribe_newsletter_professionalservices": "0",
        }
    )
    http_post(su_url, fields)

    # firstWebsiteSetup.
    site_url = step_url("firstWebsiteSetup")
    fields = parse_form(http_get(site_url))
    fields.update(
        {
            "siteName": SITE_NAME,
            "url": SITE_URL,
            "timezone": "Europe/Paris",
            "ecommerce": "0",
        }
    )
    http_post(site_url, fields)

    # trackingCode + finished finalise the install.
    http_get(step_url("trackingCode") + "&site_idSite=1")
    finished_url = step_url("finished")
    fields = parse_form(http_get(finished_url))
    fields.update({"do_not_track": "1", "anonymise_ip": "1"})
    http_post(finished_url, fields)
    log("installer finished")


# --------------------------------------------------------------------------
# Trusted hosts (config.ini.php — no API for this)
# --------------------------------------------------------------------------


def ensure_trusted_hosts():
    if not os.path.exists(CONFIG_PATH):
        log(f"WARN: {CONFIG_PATH} not found, skipping trusted_hosts")
        return
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        content = fh.read()
    missing = [h for h in TRUSTED_HOSTS if f'trusted_hosts[] = "{h}"' not in content]
    if not missing:
        log("trusted_hosts already complete")
        return
    lines = content.splitlines()
    out = []
    injected = False
    for line in lines:
        out.append(line)
        if line.strip() == "[General]" and not injected:
            for h in missing:
                out.append(f'trusted_hosts[] = "{h}"')
            injected = True
    if not injected:  # no [General] section yet — append one
        out.append("[General]")
        for h in missing:
            out.append(f'trusted_hosts[] = "{h}"')
    with open(CONFIG_PATH, "w", encoding="utf-8") as fh:
        fh.write("\n".join(out) + "\n")
    log(f"registered trusted_hosts: {', '.join(missing)}")


# --------------------------------------------------------------------------
# Authenticated API
# --------------------------------------------------------------------------


def api(method, params=None, token="anonymous"):
    fields = {
        "module": "API",
        "method": method,
        "format": "JSON",
        "token_auth": token,
    }
    if params:
        fields.update(params)
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(
        f"{MATOMO_URL}/index.php",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with opener.open(req, timeout=90) as resp:
            raw = resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as exc:  # API errors degrade, never crash
        raw = exc.read().decode("utf-8", "replace")
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"result": "error", "message": raw[:200].replace("\n", " ")}


def get_app_token():
    """Create (or reuse) an app-specific token using the superuser password.

    Tokens are hashed at rest, so an existing one can't be re-read from Matomo.
    We cache the value in /out/token and reuse it (after validating it still
    authenticates) to stay idempotent and avoid creating a token per `up`.
    """
    cached_path = os.path.join(OUT_DIR, "token")
    if os.path.exists(cached_path):
        with open(cached_path, encoding="utf-8") as fh:
            cached = fh.read().strip()
        if cached:
            # Validate against an auth-requiring method: a list means the token
            # still authenticates; an error dict means it's stale (e.g. the DB
            # volume was recreated) and we must mint a fresh one.
            check = api("SitesManager.getAllSites", token=cached)
            if isinstance(check, list):
                log("reusing cached app token")
                return cached
    result = api(
        "UsersManager.createAppSpecificTokenAuth",
        {
            "userLogin": SU_LOGIN,
            "passwordConfirmation": SU_PASSWORD,
            "description": TOKEN_DESCRIPTION,
        },
    )
    if isinstance(result, dict):
        token = result.get("value")
        if not token and result.get("result") == "error":
            fail(f"token creation failed: {result.get('message')}")
        if not token:
            fail(f"unexpected token response: {result}")
        return token
    fail(f"unexpected token response: {result}")


def ensure_site(token):
    sites = api("SitesManager.getAllSites", token=token)
    if isinstance(sites, list):
        for site in sites:
            if site.get("name") == SITE_NAME:
                log(f"site '{SITE_NAME}' already exists (idSite={site['idsite']})")
                return str(site["idsite"])
    result = api(
        "SitesManager.addSite",
        {"siteName": SITE_NAME, "urls": SITE_URL, "timezone": "Europe/Paris"},
        token=token,
    )
    idsite = result.get("value") if isinstance(result, dict) else result
    log(f"created site '{SITE_NAME}' (idSite={idsite})")
    return str(idsite)


def ensure_custom_dimensions(token, idsite):
    existing = api(
        "CustomDimensions.getConfiguredCustomDimensions",
        {"idSite": idsite},
        token=token,
    )
    have = {d.get("name") for d in existing} if isinstance(existing, list) else set()
    for name in CUSTOM_DIMENSIONS:
        if name in have:
            log(f"custom dimension '{name}' already configured")
            continue
        api(
            "CustomDimensions.configureNewCustomDimension",
            {"idSite": idsite, "name": name, "scope": "action", "active": "1"},
            token=token,
        )
        log(f"configured custom dimension '{name}'")


def apply_cnil_privacy(token):
    """Mirror the production CNIL exemption privacy config (best-effort)."""
    # Sensitive settings require a password re-confirmation when called with a
    # token; pass it on every call. Param names verified against Matomo 5.11.
    calls = [
        (
            "PrivacyManager.setAnonymizeIpSettings",
            {
                "anonymizeIPEnable": "1",
                "ipAddressMaskLength": "2",
                "useAnonymizedIpForVisitEnrichment": "1",
                "anonymizeUserId": "1",
                "anonymizeOrderId": "1",
                "anonymizeReferrer": "",
                "forceCookielessTracking": "0",
                "passwordConfirmation": SU_PASSWORD,
            },
        ),
        (
            "PrivacyManager.setDeleteLogsSettings",
            {
                "enableDeleteLogs": "1",
                "deleteLogsOlderThan": "750",
                "passwordConfirmation": SU_PASSWORD,
            },
        ),
        ("PrivacyManager.activateDoNotTrack", {}),
    ]
    for method, params in calls:
        result = api(method, params, token=token)
        ok = not (isinstance(result, dict) and result.get("result") == "error")
        log(f"privacy {method}: {'ok' if ok else result.get('message', 'skipped')}")


def write_outputs(token, idsite):
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, "token"), "w", encoding="utf-8") as fh:
        fh.write(token)
    with open(os.path.join(OUT_DIR, "credentials.txt"), "w", encoding="utf-8") as fh:
        fh.write(
            "Local Matomo — egapro\n"
            f"URL            : http://localhost:8080/\n"
            f"Login          : {SU_LOGIN}\n"
            f"Password       : {SU_PASSWORD}\n"
            f"Site ID        : {idsite}\n"
            f"API token      : {token}\n"
        )
    log(f"wrote token + credentials to {OUT_DIR}/")


def main():
    wait_for_matomo()
    if is_installed():
        log("Matomo already installed — ensuring config only")
    else:
        install()
    ensure_trusted_hosts()
    token = get_app_token()
    idsite = ensure_site(token)
    ensure_custom_dimensions(token, idsite)
    apply_cnil_privacy(token)
    write_outputs(token, idsite)
    log("provisioning complete")


if __name__ == "__main__":
    main()
