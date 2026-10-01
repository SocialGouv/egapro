"""JSON (de)serialization with ujson, keeping the output of ujson 1.35.

ujson < 5.4 has memory-safety bugs in its decoder, and roll parses every request
body with it. Recent ujson versions refuse to serialize dates and no longer round
floats, where 1.35 silently did both: stored declarations and API responses rely
on that, so reproduce it explicitly instead of changing the data.
"""
import calendar
import math
from datetime import date, datetime

import ujson

# ujson 1.35 wrote 10 digits after the decimal point (eg. 99.99999999999 -> 100.0).
FLOAT_DIGITS = 10
# Same nesting limit as the ujson encoder: deeper (or cyclic) values are refused.
MAX_DEPTH = 1024

JSONDecodeError = ujson.JSONDecodeError


def reject_non_finite(value):
    # ujson 1.35 refused NaN and Infinity, ujson 5 reads them as floats (that it
    # would then write back as invalid JSON). Iterative: bodies may nest deeply.
    stack = [value]
    while stack:
        item = stack.pop()
        if isinstance(item, float) and not math.isfinite(item):
            raise JSONDecodeError("NaN and Infinity are not valid JSON values")
        if isinstance(item, dict):
            stack.extend(item.values())
        elif isinstance(item, list):
            stack.extend(item)
    return value


def loads(s):
    return reject_non_finite(ujson.loads(s))


def load(fp):
    return reject_non_finite(ujson.load(fp))


# Postgres jsonb cannot hold NaN nor Infinity: what it returns needs no walk (exports
# read every declaration).
loads_jsonb = ujson.loads


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
    """Copy `value` with its floats rounded, without recursion."""
    root = [value]
    stack = [(root, 0, 0)]
    while stack:
        parent, key, depth = stack.pop()
        item = parent[key]
        if isinstance(item, float):
            parent[key] = round(item, FLOAT_DIGITS)
            continue
        if isinstance(item, dict):
            # items(), not dict(item): models.Data overrides keys() and __getitem__.
            item = parent[key] = dict(item.items())
            keys = list(item)
        elif isinstance(item, (list, tuple)):
            item = parent[key] = list(item)
            keys = range(len(item))
        else:
            continue
        if depth > MAX_DEPTH:
            raise OverflowError("Maximum recursion level reached")
        stack.extend((item, k, depth + 1) for k in keys)
    return root[0]


def legacy_options(kwargs):
    kwargs.setdefault("default", legacy_default)
    # ujson 1.35 wrote bytes as (UTF-8) strings; roll error messages are bytes.
    kwargs.setdefault("reject_bytes", False)
    # ujson 1.35 raised an OverflowError on NaN and Infinity.
    kwargs.setdefault("allow_nan", False)
    return kwargs


def dumps(obj, **kwargs):
    return ujson.dumps(legacy_floats(obj), **legacy_options(kwargs))


def dump(obj, fp, **kwargs):
    return ujson.dump(legacy_floats(obj), fp, **legacy_options(kwargs))
