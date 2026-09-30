import io

import pytest

from egapro import csv_representation, db, dgt, dgt_representation, exporter


@pytest.mark.parametrize(
    "module", [exporter, dgt, dgt_representation, csv_representation]
)
def test_clean_cell_neutralizes_formulas(module):
    assert module.clean_cell('=HYPERLINK("http://evil.com")') == '\'=HYPERLINK("http://evil.com")'
    # Leading whitespaces are stripped before checking.
    assert module.clean_cell("  \t@SUM(A1)") == "'@SUM(A1)"
    assert module.clean_cell("Total  Recall") == "Total Recall"
    assert module.clean_cell(-3) == -3
    assert module.clean_cell(12.5) == 12.5
    assert module.clean_cell(None) is None


@pytest.fixture
async def init_db():
    await db.init()
    yield
    await db.terminate()


@pytest.mark.asyncio
async def test_public_data_csv_neutralizes_formulas(init_db, declaration):
    await declaration(siren="514027945", year=2020, company="=1+1", grade=26)
    out = io.StringIO()
    await exporter.public_data(out)
    lines = out.getvalue().splitlines()
    assert len(lines) == 2
    cells = lines[1].split(";")
    assert cells[3] == "514027945"
    assert cells[4] == "'=1+1"
    assert cells[-1] == "26"
