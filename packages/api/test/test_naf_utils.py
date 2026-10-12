import fastjsonschema
import pytest

from egapro.naf_utils import NAF, format_naf_code
from egapro.schema.utils import naf


@pytest.mark.parametrize(
    ("code", "expected"),
    [
        ("62.01Z", f"62.01Z - {NAF['62.01Z']}"),
        ("99.99Z", "99.99Z - inconnu"),
        ("03.11Y", "03.11Y - inconnu"),
        ("", ""),
        ("[NON-DIFFUSIBLE]", "[NON-DIFFUSIBLE]"),
        (None, None),
    ],
)
def test_format_naf_code(code, expected):
    assert format_naf_code(code) == expected


@pytest.mark.parametrize("code", ["62.01Z", "03.11Y", "10.51G", "99.99Z"])
def test_naf_schema_accepts_codes_with_the_standard_format(code):
    validate = fastjsonschema.compile(naf())

    assert validate(code) == code


@pytest.mark.parametrize(
    "code",
    [
        "",
        " ",
        "toto",
        "<script>",
        "[NON-DIFFUSIBLE]",
        "62.01",
        "123.45Z",
        "6201Z",
        "62.01z",
        "６２.０１Z",
        "62.01Z\n",
        "62.01Z\r\n",
        "62.01Z ",
        " 62.01Z",
    ],
)
def test_naf_schema_rejects_invalid_codes(code):
    validate = fastjsonschema.compile(naf())

    with pytest.raises(fastjsonschema.JsonSchemaValueException):
        validate(code)
