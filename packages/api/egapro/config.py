import os
from typing import NamedTuple

SECRET = "sikretfordevonly"
JWT_ALGORITHM = "HS256"
SEND_EMAILS = False
SMTP_HOST = "127.0.0.1"
SMTP_PORT = 1025
SMTP_PASSWORD = ""
SMTP_LOGIN = ""
SMTP_SSL = False
FROM_EMAIL = "EgaPro <index@travail.gouv.fr>"
SITE_DESCRIPTION = "Egapro"
EMAIL_SIGNATURE = "Egapro"
DBNAME = "egapro"
DBHOST = "localhost"
DBPORT = 5432
DBUSER = "postgres"
DBPASS = "postgres"
DBSSL = "disable"
DBMINSIZE = 2
DBMAXSIZE = 10
BASE_URL = ""
ALLOW_ORIGIN = "*"
STAFF = []
SENTRY_DSN = ""
FLAVOUR = "local"
API_ENTREPRISES = ""
DOMAIN = "https://egapro.travail.gouv.fr"
READONLY = False
S3_ENDPOINT = ""
S3_REGION = ""
S3_BUCKET_NAME = ""
S3_PREFIX = ""
S3_ACCESS_KEY_ID = ""
S3_SECRET_ACCESS_KEY = ""

# The storage settings are also read by the Node files server, which has no
# EGAPRO_ prefix convention: one contract, no per-runtime renaming.
# Lowercase on purpose: init() would otherwise read EGAPRO_storage_keys.
storage_keys = (
    "S3_ENDPOINT",
    "S3_REGION",
    "S3_BUCKET_NAME",
    "S3_PREFIX",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
)
storage_required_keys = tuple(key for key in storage_keys if key != "S3_PREFIX")


class StorageSettings(NamedTuple):
    endpoint: str
    region: str
    bucket: str
    prefix: str
    access_key_id: str
    secret_access_key: str


# Development values that must be overridden by env vars in production.
_dev_defaults = {"SECRET": SECRET, "DBPASS": DBPASS}


# Deployments whose credentials may be the development ones (review apps). Any
# other flavour, including an unset one, is checked: fail closed.
# Lowercase on purpose: init() reads every uppercase global from an EGAPRO_* env var.
dev_flavours = {"dev"}


def is_production():
    # Set by the production Docker image (see Dockerfile), not by Dockerfile.dev.
    return os.environ.get("PRODUCTION", "").lower() == "true"


def check():
    """Refuse to run a deployed (non dev) instance with the development credentials."""
    if not is_production() or FLAVOUR in dev_flavours:
        return
    insecure = [
        key for key, default in _dev_defaults.items()
        if not globals()[key] or globals()[key] == default
    ]
    if insecure:
        names = ", ".join(f"EGAPRO_{key}" for key in insecure)
        raise RuntimeError(f"Insecure configuration, please define: {names}")


# Lowercase too, or EGAPRO_TRUE_VALUES would redefine what "true" means.
true_values = {"1", "true", "yes", "on"}
false_values = {"", "0", "false", "no", "off"}


def parse_bool(value):
    """Parse an EGAPRO_* boolean env var. `bool("false")` is True: be explicit, and refuse
    anything that is neither clearly true nor clearly false rather than guess."""
    normalized = str(value).strip().lower()
    if normalized in true_values:
        return True
    if normalized in false_values:
        return False
    raise ValueError(f"Invalid boolean value {value!r}, expected one of: 1, true, yes, on, 0, false, no, off")


def allowed_origins():
    """Explicit origins allowed by EGAPRO_ALLOW_ORIGIN (comma separated), "*" excluded."""
    return [o.strip().rstrip("/") for o in ALLOW_ORIGIN.split(",") if o.strip() not in ("", "*")]


def storage_settings():
    """Refuse a partial storage configuration, naming every missing key, instead of
    failing later on an opaque network error."""
    missing = [key for key in storage_required_keys if not globals()[key]]
    if missing:
        raise RuntimeError(f"Missing storage configuration: {', '.join(missing)}")
    return StorageSettings(
        endpoint=S3_ENDPOINT,
        region=S3_REGION,
        bucket=S3_BUCKET_NAME,
        prefix=S3_PREFIX,
        access_key_id=S3_ACCESS_KEY_ID,
        secret_access_key=S3_SECRET_ACCESS_KEY,
    )


def init():
    for key, value in globals().items():
        if key.isupper():
            env_key = key if key in storage_keys else "EGAPRO_" + key
            typ = type(value)
            if typ is bool:
                typ = parse_bool
            elif typ in (list, tuple, set):
                real_type, typ = typ, lambda x: real_type(x.split(","))
            if env_key in os.environ:
                globals()[key] = typ(os.environ[env_key])
    check()


def debug():
    for key, value in globals().items():
        if not key.isupper():
            continue
        print(f"{key}={value}")


init()
