from datetime import date, datetime, timedelta, timezone

import roll.io
import ujson

from egapro import jsonlib, views  # noqa: F401 (views patches roll)


def test_ujson_is_recent_enough():
    # ujson < 5.4 has memory-safety bugs in its decoder, reachable from request bodies.
    major, minor = (int(p) for p in ujson.__version__.split(".")[:2])
    assert (major, minor) >= (5, 4)


def test_dates_are_written_as_ujson_1_35_did():
    # Expected values produced by ujson 1.35.
    naive = datetime(2026, 9, 30, 10, 29, 58, 82206)
    aware = datetime(2026, 9, 30, 10, 29, 58, tzinfo=timezone(timedelta(hours=2)))
    assert jsonlib.dumps([naive, aware, date(2026, 9, 30)]) == (
        "[1790764198,1790756998,1790726400]"
    )


def test_floats_are_rounded_as_ujson_1_35_did():
    values = [1 / 3, 99.99999999999, 2.0 / 3 * 100, 85.5, -0.1 - 0.2, 0.1 + 0.2]
    assert jsonlib.loads(jsonlib.dumps({"v": values}))["v"] == [
        0.3333333333,
        100.0,
        66.6666666667,
        85.5,
        -0.3,
        0.3,
    ]


def test_bytes_are_written_as_strings():
    assert jsonlib.dumps({"error": b"boom"}) == '{"error":"boom"}'


def test_roll_uses_jsonlib():
    assert roll.io.json is jsonlib
