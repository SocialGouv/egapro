from datetime import date, datetime, timedelta, timezone
from importlib import import_module

import json


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
