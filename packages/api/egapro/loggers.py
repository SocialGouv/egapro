import logging
import re
from importlib import metadata

import sentry_sdk

from . import config


logger = logging.getLogger("egapro")
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

sentry = None

# Never send credentials to logs or Sentry, nor request headers/bodies (tokens,
# declarations). Personal data is only logged where an audit trail needs it: the
# email of authentication events (token requests, ownership checks).
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
    # Local variables hold tokens, emails and declarations: never send them, even
    # if a future init forgets `include_local_variables=False`.
    for key in ("exception", "threads"):
        for value in (event.get(key) or {}).get("values") or []:
            for frame in ((value or {}).get("stacktrace") or {}).get("frames") or []:
                if isinstance(frame, dict):
                    frame.pop("vars", None)
    return event


def init():
    sentry_sdk.init(
        config.SENTRY_DSN,
        release=metadata.version("egapro"),
        environment=config.FLAVOUR,
        send_default_pii=False,
        include_local_variables=False,
        before_send=scrub_event,
    )
