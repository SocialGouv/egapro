from egapro import constants
from naf import DB as NAF


def regions():
    return {"type": "string", "enum": constants.REGIONS.keys()}


def departements():
    return {"type": "string", "enum": constants.DEPARTEMENTS.keys()}


def naf():
    return {"type": "string", "enum": NAF.keys()}


def code_pays():
    return {"type": "string", "enum": constants.PAYS_ISO_TO_LIB.keys()}


def years():
    return {
        "type": "integer",
        "enum": constants.YEARS,
    }


def clean_readonly(data, schema):
    if not data:
        return
    for key, subschema in schema.get("properties", {}).items():
        if subschema.get("readOnly"):
            try:
                del data[key]
            except KeyError:
                pass
            continue
        clean_readonly(data.get(key), subschema)
