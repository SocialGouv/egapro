import os

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

# Development values that must be overridden by env vars in production.
_dev_defaults = {"SECRET": SECRET, "DBPASS": DBPASS}


def is_production():
    # Set by the production Docker image (see Dockerfile), not by Dockerfile.dev.
    return os.environ.get("PRODUCTION", "").lower() == "true"


def check():
    """Refuse to run a production instance with the development credentials."""
    if not is_production():
        return
    insecure = [
        key for key, default in _dev_defaults.items()
        if not globals()[key] or globals()[key] == default
    ]
    if insecure:
        names = ", ".join(f"EGAPRO_{key}" for key in insecure)
        raise RuntimeError(f"Insecure configuration, please define: {names}")


def allowed_origins():
    """Explicit origins allowed by EGAPRO_ALLOW_ORIGIN (comma separated), "*" excluded."""
    return [o.strip().rstrip("/") for o in ALLOW_ORIGIN.split(",") if o.strip() not in ("", "*")]


def init():
    for key, value in globals().items():
        if key.isupper():
            env_key = "EGAPRO_" + key
            typ = type(value)
            if typ in (list, tuple, set):
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
