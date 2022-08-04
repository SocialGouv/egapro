import logging
from importlib import metadata

import sentry_sdk

from . import config


logger = logging.getLogger("egapro")
logger.setLevel(logging.DEBUG)
logger.addHandler(logging.StreamHandler())

sentry = None


def log_request(request):
    logger.info(f"Path: {request.path}")
    logger.info(f"User-agent: {request.headers.get('USER-AGENT')}")
    try:
        data = request.data
    except:
        pass
    else:
        logger.info(data.raw)
        sentry_sdk.set_context("data", data.raw)


def init():
    sentry_sdk.init(
        config.SENTRY_DSN,
        release=metadata.version("egapro"),
        environment=config.FLAVOUR,
    )
