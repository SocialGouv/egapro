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
