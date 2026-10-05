import pytest

from egapro import config


def test_check_is_silent_outside_production(monkeypatch):
    monkeypatch.delenv("PRODUCTION", raising=False)
    config.check()  # Development defaults are fine.


def test_check_refuses_development_secrets_in_production(monkeypatch):
    monkeypatch.setenv("PRODUCTION", "true")
    with pytest.raises(RuntimeError) as err:
        config.check()
    assert "EGAPRO_SECRET" in str(err.value)
    assert "EGAPRO_DBPASS" in str(err.value)


def test_check_refuses_empty_secret_in_production(monkeypatch):
    monkeypatch.setenv("PRODUCTION", "true")
    monkeypatch.setattr("egapro.config.SECRET", "")
    monkeypatch.setattr("egapro.config.DBPASS", "a-real-password")
    with pytest.raises(RuntimeError) as err:
        config.check()
    assert "EGAPRO_SECRET" in str(err.value)
    assert "EGAPRO_DBPASS" not in str(err.value)


def test_check_accepts_real_secrets_in_production(monkeypatch):
    monkeypatch.setenv("PRODUCTION", "true")
    monkeypatch.setattr("egapro.config.SECRET", "a-real-secret")
    monkeypatch.setattr("egapro.config.DBPASS", "a-real-password")
    config.check()


def test_init_fails_fast_in_production(monkeypatch):
    monkeypatch.setenv("PRODUCTION", "true")
    monkeypatch.delenv("EGAPRO_SECRET", raising=False)
    monkeypatch.setattr("egapro.config.SECRET", config._dev_defaults["SECRET"])
    monkeypatch.setattr("egapro.config.DBPASS", "a-real-password")
    with pytest.raises(RuntimeError):
        config.init()


@pytest.mark.parametrize(
    "value,expected",
    [
        ("*", []),
        ("", []),
        ("https://foo.fr", ["https://foo.fr"]),
        ("https://foo.fr/, http://localhost:3000 ,*", ["https://foo.fr", "http://localhost:3000"]),
    ],
)
def test_allowed_origins(monkeypatch, value, expected):
    monkeypatch.setattr("egapro.config.ALLOW_ORIGIN", value)
    assert config.allowed_origins() == expected


@pytest.mark.parametrize("flavour", ["preprod", "prod", "local"])
def test_check_refuses_development_secret_in_deployed_flavours(monkeypatch, flavour):
    # "local" is the default when EGAPRO_FLAVOUR is not set: fail closed.
    monkeypatch.setenv("PRODUCTION", "true")
    monkeypatch.setattr("egapro.config.FLAVOUR", flavour)
    monkeypatch.setattr("egapro.config.SECRET", config._dev_defaults["SECRET"])
    monkeypatch.setattr("egapro.config.DBPASS", "a-real-password")
    with pytest.raises(RuntimeError, match="EGAPRO_SECRET"):
        config.check()


def test_check_lets_review_apps_run_with_development_secrets(monkeypatch):
    # Review apps (global.env = dev) run the production image with dev credentials.
    monkeypatch.setenv("PRODUCTION", "true")
    monkeypatch.setattr("egapro.config.FLAVOUR", "dev")
    monkeypatch.setattr("egapro.config.SECRET", config._dev_defaults["SECRET"])
    monkeypatch.setattr("egapro.config.DBPASS", config._dev_defaults["DBPASS"])
    config.check()


@pytest.mark.parametrize(
    "value,expected",
    [
        ("1", True),
        ("True", True),
        ("true", True),
        (" yes ", True),
        ("on", True),
        ("", False),
        ("0", False),
        ("False", False),
        ("false", False),
        ("no", False),
        ("off", False),
    ],
)
def test_parse_bool(value, expected):
    assert config.parse_bool(value) is expected


@pytest.mark.parametrize("value", ["maybe", "2", "nope"])
def test_parse_bool_refuses_ambiguous_values(value):
    with pytest.raises(ValueError):
        config.parse_bool(value)


def test_init_parses_boolean_env_vars(monkeypatch):
    # init() rewrites the module globals: register them so they are restored after the test.
    for key in ("SEND_EMAILS", "SMTP_SSL", "READONLY"):
        monkeypatch.setattr(config, key, getattr(config, key))
    # bool("false") is True: the config must not read "false" as enabled.
    monkeypatch.setenv("EGAPRO_SEND_EMAILS", "false")
    monkeypatch.setenv("EGAPRO_SMTP_SSL", "1")
    monkeypatch.setenv("EGAPRO_READONLY", "")
    config.init()
    assert config.SEND_EMAILS is False
    assert config.SMTP_SSL is True
    assert config.READONLY is False


@pytest.mark.parametrize("env_key", ["EGAPRO_TRUE_VALUES", "EGAPRO_DEV_FLAVOURS"])
def test_init_only_reads_settings_from_env(monkeypatch, env_key):
    # The parser vocabulary and the review-app flavours are not settings: no env var redefines them.
    monkeypatch.setenv(env_key, "maybe,preprod")
    config.init()
    with pytest.raises(ValueError):
        config.parse_bool("maybe")
    assert config.dev_flavours == {"dev"}
