import pytest

from egapro.models import Data


def test_data_validated():
    data = Data()
    assert data.validated
    data = Data({"déclaration": {"brouillon": False}})
    assert data.validated
    data = Data({"déclaration": {"brouillon": True}})
    assert not data.validated


def test_data_year():
    data = Data()
    assert data.year is None
    data = Data({"déclaration": {"année_indicateurs": 2020}})
    assert data.year == 2020
    data = Data({"déclaration": {"fin_période_référence": "31/12/2019"}})
    assert data.year == 2019


@pytest.mark.parametrize(
    "data,path,output",
    [
        ({"a": {"b": "ok"}}, "a.b", "ok"),
        ({"a": {"b": "ok"}}, "a.c", None),
        ({"a": {"b": False}}, "a.b", False),
        ({"a": {"b": 0}}, "a.b", 0),
        ({"a": {"b": {"c": "ok"}}}, "a.b", {"c": "ok"}),
        ({"a": {"b": {"c": "ok"}}}, "a.b.c", "ok"),
        ({"a": {"b": {"c": "ok"}}}, "a.b.d", None),
    ],
)
def test_path(data, path, output):
    assert Data(data).path(path) == output
