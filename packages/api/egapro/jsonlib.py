"""JSON (de)serialization with ujson, keeping the output of ujson 1.35.

ujson < 5.4 has memory-safety bugs in its decoder, and roll parses every request
body with it. Recent ujson versions refuse to serialize dates and no longer round
floats, where 1.35 silently did both: stored declarations and API responses rely
on that, so reproduce it explicitly instead of changing the data.
"""
import calendar
from datetime import date, datetime

import ujson

# ujson 1.35 wrote 10 digits after the decimal point (eg. 99.99999999999 -> 100.0).
FLOAT_DIGITS = 10

loads = ujson.loads
load = ujson.load
JSONDecodeError = ujson.JSONDecodeError


def legacy_default(value):
    # ujson 1.35 wrote dates and datetimes as a Unix timestamp (seconds), naive
    # datetimes being read as UTC.
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return calendar.timegm(value.timetuple())
        return int(value.timestamp())
    if isinstance(value, date):
        return calendar.timegm(value.timetuple())
    raise TypeError(f"{value!r} is not JSON serializable")


def legacy_floats(value):
    if isinstance(value, float):
        return round(value, FLOAT_DIGITS)
    if isinstance(value, dict):
        return {k: legacy_floats(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [legacy_floats(v) for v in value]
    return value


def legacy_options(kwargs):
    kwargs.setdefault("default", legacy_default)
    # ujson 1.35 wrote bytes as (UTF-8) strings; roll error messages are bytes.
    kwargs.setdefault("reject_bytes", False)
    return kwargs


def dumps(obj, **kwargs):
    return ujson.dumps(legacy_floats(obj), **legacy_options(kwargs))


def dump(obj, fp, **kwargs):
    return ujson.dump(legacy_floats(obj), fp, **legacy_options(kwargs))
