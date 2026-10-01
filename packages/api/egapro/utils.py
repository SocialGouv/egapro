from datetime import date, datetime, timedelta, timezone
from email.utils import parseaddr
from importlib import import_module

import json
import re


def default_json(v):
    if isinstance(v, (datetime, date)):
        return v.isoformat()
    return str(v)


def json_dumps(v):
    return json.dumps(v, default=default_json, indent=None)


def utcnow():
    return datetime.now(timezone.utc)


def remove_one_year(end):
    try:
        return end.replace(end.year - 1) + timedelta(days=1)
    except ValueError:  # 29 February
        return (end + timedelta(days=1)).replace(end.year - 1)


def prepare_query(query: str) -> str:
    if not query:
        return query
    # TODO deal with edge cases ( | , !…)
    query = query.replace("&", " ")  # Escape &.
    query = query.replace("(", " ").replace(")", " ")  # Escape ().
    query = " ".join(query.split())  # Remove multiple whitespaces.
    query = query.replace(" ", " & ")
    if not query.endswith("*"):
        # Prefix search on last token, to autocomplete.
        query = query + ":*"
    return query


def flatten(b, prefix="", delim=".", val=None, flatten_lists=False):
    # See https://stackoverflow.com/a/57228641/330911
    if val is None:
        val = {}
    if isinstance(b, dict):
        if prefix:
            prefix = prefix + delim
        for j in b.keys():
            flatten(b[j], prefix + j, delim, val, flatten_lists)
    elif flatten_lists and isinstance(b, list):
        get = b
        for j in range(len(get)):
            flatten(get[j], prefix + delim + str(j), delim, val, flatten_lists)
    else:
        val[prefix] = b
    return val


# Exactly one address: no list separator, display name, quote, comment, whitespace
# nor control character (a list like "a@x.fr, b@x.fr" is delivered to everyone).
EMAIL_MAX_LENGTH = 254
EMAIL_PART = r"[^@\s\x00-\x1f\x7f,;<>()\[\]\"\\]+"
EMAIL = re.compile(rf"{EMAIL_PART}@{EMAIL_PART}\.{EMAIL_PART}")


def normalize_email(value):
    """Return the lower cased address when `value` is a single valid email, else None."""
    if not isinstance(value, str):
        return None
    value = value.strip().lower()
    if len(value) > EMAIL_MAX_LENGTH:
        return None
    if not EMAIL.fullmatch(value) or parseaddr(value) != ("", value):
        return None
    return value


# Spreadsheet software may interpret those leading characters as a formula.
FORMULA_TRIGGERS = ("=", "+", "-", "@", "\t", "\r")
# openpyxl only writes strings starting with "=" as formulas: the others are stored
# as text cells, never evaluated, so a leading quote would only show up in the cell.
XLSX_FORMULA_TRIGGERS = ("=",)
NUMBER = re.compile(r"^[+-]?\d+([.,]\d+)?$")


def escape_formula(value, triggers=FORMULA_TRIGGERS):
    """Neutralize CSV formula injection by prefixing risky strings with a `'`.

    Only strings are concerned: numbers (including negative ones) are untouched, as
    are strings holding a plain number (eg. "-12.5")."""
    if (
        isinstance(value, str)
        and value.startswith(triggers)
        and not NUMBER.match(value)
    ):
        return "'" + value
    return value


def escape_xlsx_formula(value):
    """Neutralize formula injection in a cell written by openpyxl."""
    return escape_formula(value, XLSX_FORMULA_TRIGGERS)


def unflatten(d, delim="."):
    # From https://stackoverflow.com/a/6037657
    result = dict()
    for key, value in d.items():
        parts = key.split(delim)
        d = result
        for part in parts[:-1]:
            if part not in d:
                d[part] = dict()
            d = d[part]
        d[parts[-1]] = value
    return result


def import_by_path(path):
    """
    Import variables, functions or class by their path. Should be of the form:
    path.to.module.func
    """
    if not isinstance(path, str):
        return path
    module_path, *name = path.rsplit(".", 1)
    func = import_module(module_path)
    if name:
        func = getattr(func, name[0])
    return func


def official_round(i):
    """The threshold is x.05, instead of x.5.

    So for example, 0.01 should be rounded to 0, while 0.1 should be rounded to 1.
    """
    return round(float(i) + 0.5 - 0.049)

def delete_keypath(obj: dict, path: str):
    data = obj
    keys = path.split(".")
    last_key = keys.pop()
    for sub in keys:
        data = data.get(sub, {})
    if last_key in data:
        del data[last_key]
    return obj

