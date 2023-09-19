from datetime import timedelta
from functools import wraps

import jwt
from roll import HttpError

from . import config, utils
from .loggers import logger


def create(email):
    return jwt.encode(
        {"sub": str(email), "exp": utils.utcnow() + timedelta(days=1)},
        config.SECRET,
        config.JWT_ALGORITHM,
    )


def read(token):
    try:
        decoded = jwt.decode(token, config.SECRET, algorithms=[config.JWT_ALGORITHM])
    except (jwt.DecodeError, jwt.ExpiredSignatureError):
        raise ValueError
    return decoded["sub"]


def require(view):
    @wraps(view)
    def wrapper(request, response, *args, **kwargs):
        token = request.headers.get("API-KEY") or request.cookies.get("api-key")
        if not token:
            logger.debug("Request without token on %s", request.path)
            raise HttpError(401, "No authentication token was provided.")
        try:
            email = read(token)
        except ValueError:
            logger.debug(
                "Invalid token on %s (token: %s, referrer: %s)",
                request.path,
                token,
                request.referrer,
            )
            raise HttpError(401, "Invalid token")
        email = email.lower()
        request["email"] = email
        request["staff"] = email in config.STAFF
        return view(request, response, *args, **kwargs)

    return wrapper
