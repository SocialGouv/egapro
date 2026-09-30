import logging
import re
from importlib import metadata

import sentry_sdk

from . import config


logger = logging.getLogger("egapro")
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

sentry = None

# Never send credentials nor personal data to logs or Sentry.
SENSITIVE_HEADERS = {"api-key", "authorization", "cookie", "set-cookie", "x-real-ip"}


CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")


def safe(value):
    """Escape control characters of a client supplied value before logging it.

    roll URL-decodes the path, so `%0A` arrives as a real newline: logged raw, it
    would let anyone forge log lines."""
    return CONTROL_CHARS.sub(lambda m: f"\\x{ord(m.group()):02x}", str(value))


def log_request(request):
    # Do not log the body nor the headers: they contain tokens and personal data.
    logger.info(f"Request: {request.method} {safe(request.path)}")
    logger.info(f"User-agent: {request.headers.get('USER-AGENT')}")


def scrub_event(event, hint=None):
    """Sentry `before_send` hook: remove credentials and personal data."""
    event.pop("user", None)
    request = event.get("request")
    if isinstance(request, dict):
        request.pop("cookies", None)
        request.pop("data", None)
        request.pop("query_string", None)
        headers = request.get("headers")
        if isinstance(headers, dict):
            request["headers"] = {
                k: v for k, v in headers.items() if k.lower() not in SENSITIVE_HEADERS
            }
    return event


def init():
    sentry_sdk.init(
        config.SENTRY_DSN,
        release=metadata.version("egapro"),
        environment=config.FLAVOUR,
        send_default_pii=False,
        before_send=scrub_event,
    )
