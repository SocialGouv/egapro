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
