from egapro import loggers


def test_scrub_event_removes_credentials_and_personal_data():
    event = {
        "user": {"email": "foo@bar.org", "ip_address": "1.2.3.4"},
        "request": {
            "url": "https://egapro.travail.gouv.fr/api/me",
            "method": "GET",
            "query_string": "token=secret",
            "cookies": {"api-key": "secret"},
            "data": {"déclarant": {"email": "foo@bar.org"}},
            "headers": {
                "API-KEY": "secret",
                "Authorization": "Bearer secret",
                "Cookie": "api-key=secret",
                "X-Real-Ip": "1.2.3.4",
                "User-Agent": "Mozilla",
            },
        },
    }
    event = loggers.scrub_event(event)
    assert "user" not in event
    assert event["request"] == {
        "url": "https://egapro.travail.gouv.fr/api/me",
        "method": "GET",
        "headers": {"User-Agent": "Mozilla"},
    }
    assert "secret" not in str(event)


def test_scrub_event_removes_frame_local_variables():
    def frames():
        return {
            "frames": [
                {
                    "function": "send_token",
                    "vars": {"token": "secret", "email": "foo@bar.org"},
                },
                {"function": "read", "lineno": 12},
            ]
        }

    event = {
        "exception": {"values": [{"type": "ValueError", "stacktrace": frames()}, {}]},
        "threads": {"values": [{"id": 1, "stacktrace": frames()}]},
    }
    event = loggers.scrub_event(event)
    for key in ("exception", "threads"):
        assert event[key]["values"][0]["stacktrace"]["frames"] == [
            {"function": "send_token"},
            {"function": "read", "lineno": 12},
        ]
    assert "secret" not in str(event)
    assert "foo@bar.org" not in str(event)


def test_sentry_never_collects_local_variables(monkeypatch):
    calls = []
    monkeypatch.setattr(loggers.sentry_sdk, "init", lambda *a, **kw: calls.append(kw))
    loggers.init()
    assert calls[0]["include_local_variables"] is False
    assert calls[0]["before_send"] is loggers.scrub_event
