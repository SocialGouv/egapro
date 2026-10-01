import io
from datetime import date, datetime, timedelta, timezone

import pytest
import roll.io
import ujson

from egapro import jsonlib, models, views  # noqa: F401 (views patches roll)


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


@pytest.mark.parametrize(
    "value", [float("nan"), float("inf"), -float("inf"), {"a": [1, float("nan")]}]
)
def test_non_finite_floats_are_not_written(value):
    # NaN and Infinity are not valid JSON: ujson 1.35 raised, so do we.
    with pytest.raises(OverflowError):
        jsonlib.dumps(value)


@pytest.mark.parametrize(
    "body",
    [
        "NaN",
        "Infinity",
        "-Infinity",
        '{"a": [1, NaN]}',
        '{"a": {"b": Infinity}}',
        "1e400",
    ],
)
def test_non_finite_floats_are_not_read(body):
    with pytest.raises(jsonlib.JSONDecodeError):
        jsonlib.loads(body)
    with pytest.raises(jsonlib.JSONDecodeError):
        jsonlib.load(io.StringIO(body))


def nested(depth):
    value = [0.1 + 0.2]
    for _ in range(depth):
        value = {"a": [value]}
    return value


def test_deeply_nested_values_are_written():
    # The deepest body ujson accepts used to raise a RecursionError when written.
    body = "[" * 1024 + "]" * 1024
    assert jsonlib.dumps(jsonlib.loads(body)) == body
    assert "0.3" in jsonlib.dumps(nested(500))


def test_too_deep_or_cyclic_values_are_refused():
    with pytest.raises(OverflowError):
        jsonlib.dumps(nested(1000))
    cyclic = []
    cyclic.append(cyclic)
    with pytest.raises(OverflowError):
        jsonlib.dumps(cyclic)


def test_dict_subclasses_are_written_as_their_items():
    # models.Data overrides keys() and __getitem__ to expose its properties.
    data = models.Data({"entreprise": {"siren": "514027945"}, "taux": 1 / 3})
    assert jsonlib.loads(jsonlib.dumps({"data": [data]})) == {
        "data": [{"entreprise": {"siren": "514027945"}, "taux": 0.3333333333}]
    }


def test_jsonb_decoder_reads_postgres_values_as_is():
    # Postgres jsonb never holds NaN nor Infinity: the codec skips the walk.
    assert jsonlib.loads_jsonb('{"a": [1.5, {"b": "c"}]}') == {"a": [1.5, {"b": "c"}]}
