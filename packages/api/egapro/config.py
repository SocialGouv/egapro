import os

SECRET = os.getenv("EGAPRO_SECRET")
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
DBSSL = False
DBMINSIZE = 2
DBMAXSIZE = 10
BASE_URL = ""
ALLOW_ORIGIN = "*"
STAFF = []
SENTRY_DSN = ""
FLAVOUR = "local"
API_ENTREPRISES = ""
ALLOWED_IPS = []
DOMAIN = "https://egapro.travail.gouv.fr"
READONLY = False


def init():
    for key, value in globals().items():
        if key.isupper():
            env_key = "EGAPRO_" + key
            typ = type(value)
            if typ in (list, tuple, set):
                real_type, typ = typ, lambda x: real_type(x.split(","))
            if env_key in os.environ:
                globals()[key] = typ(os.environ[env_key])


def debug():
    for key, value in globals().items():
        if not key.isupper():
            continue
        print(f"{key}={value}")


init()
