from egapro.schema import Schema


def test_parse():
    raw = """
key1: boolean
+key2:
  subkey: integer  # the description
  +subkey2:
    - date-time
  subkey3:
    - +ssub1: integer
      +ssub2: string
"""
    schema = Schema(raw)
    assert schema.raw == {
        "type": "object",
        "additionalProperties": False,
        "required": ["key2"],
        "properties": {
            "key1": {
                "type": "boolean",
            },
            "key2": {
                "additionalProperties": False,
                "type": "object",
                "required": ["subkey2"],
                "properties": {
                    "subkey": {
                        "type": "integer",
                        "description": "the description",
                    },
                    "subkey2": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "format": "date-time",
                        },
                    },
                    "subkey3": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["ssub1", "ssub2"],
                            "properties": {
                                "ssub1": {
                                    "type": "integer",
                                },
                                "ssub2": {
                                    "type": "string",
                                },
                            },
                        },
                    },
                },
            },
        },
    }


def test_basic_object():
    raw = """
key1:
    subkey: integer
    subkey2: date-time
"""
    schema = Schema(raw)
    assert schema.raw == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "subkey": {"type": "integer"},
                    "subkey2": {"format": "date-time", "type": "string"},
                },
            }
        },
    }


def test_basic_list():
    raw = "key1: [integer]"
    schema = Schema(raw)
    assert schema.raw == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {
                "items": {"type": "integer"},
                "type": "array",
            },
        },
    }


def test_required():
    raw = "+key1: integer"
    schema = Schema(raw).raw
    assert schema == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {
                "type": "integer",
            },
        },
        "required": ["key1"],
    }


def test_nullable():
    raw = "?key1: integer"
    schema = Schema(raw).raw
    assert schema == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {"anyOf": [{"type": "null"}, {"type": "integer"}]},
        },
    }
    raw = "key1: ?integer"
    schema = Schema(raw).raw
    assert schema == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {"oneOf": [{"type": "null"}, {"type": "integer"}]},
        },
    }


def test_liberal():
    raw = """
~key1:
    subkey: integer
"""
    schema = Schema(raw).raw
    assert schema == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {
                "type": "object",
                "properties": {"subkey": {"type": "integer"}},
                "additionalProperties": True,
            },
        },
    }


def test_readonly():
    raw = """
key1:
    subkey: integer
    =subkey2: integer
"""
    schema = Schema(raw).raw
    assert schema == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key1": {
                "type": "object",
                "properties": {
                    "subkey": {"type": "integer"},
                    "subkey2": {"type": "integer", "readOnly": True},
                },
                "additionalProperties": False,
            },
        },
    }


def test_pattern():
    raw = r"""
key: r"[\w-]"
"""
    schema = Schema(raw).raw
    assert schema == {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "key": {
                "type": "string",
                "pattern": r"[\w-]",
            },
        },
    }
