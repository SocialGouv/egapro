from datetime import timedelta

import jwt
import pytest

from egapro import config, tokens, utils


def forge(payload, algorithm=None):
    return jwt.encode(payload, config.SECRET, algorithm or config.JWT_ALGORITHM)


def test_read_returns_the_subject():
    assert tokens.read(tokens.create("foo@bar.org")) == "foo@bar.org"


@pytest.mark.parametrize(
    "token",
    [
        "invalid.token.value",
        forge({"sub": "foo@bar.org"}, algorithm="HS512"),
        forge({"exp": utils.utcnow() + timedelta(days=1)}),
        forge({"sub": "foo@bar.org", "exp": utils.utcnow() - timedelta(days=1)}),
        forge({"sub": "foo@bar.org", "nbf": utils.utcnow() + timedelta(days=1)}),
    ],
    ids=["malformed", "other-algorithm", "no-subject", "expired", "not-yet-valid"],
)
def test_read_rejects_any_invalid_token(token):
    with pytest.raises(ValueError):
        tokens.read(token)
