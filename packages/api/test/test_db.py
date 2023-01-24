from datetime import datetime, timezone

import pytest

from egapro import db, utils

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
async def init_db():
    await db.init()
    yield
    await db.terminate()


async def test_simulation_fetchval():
    assert await db.table.fetchval("SELECT current_database();") == "test_egapro"


async def test_simulation_fetchrow():
    row = await db.table.fetchrow("SELECT current_database();")
    assert row["current_database"] == "test_egapro"


async def test_simulation_create():
    # Given
    uuid = await db.simulation.create({"foo": "baré"})

    async with db.table.pool.acquire() as conn:
        count = await conn.fetchval("SELECT COUNT(*) FROM simulation WHERE id=$1", uuid)
    assert count == 1


async def test_simulation_get():
    # Given
    uuid = await db.simulation.create({"foo": "baré"})
    # When
    record = await db.simulation.get(uuid)
    # Then
    assert sorted(record.keys()) == ["data", "id", "modified_at"]
    assert record["data"] == {"foo": "baré"}


async def test_declaration_completed():
    # Given
    await db.declaration.put(
        "12345678",
        2020,
        "foo@bar.com",
        {"déclaration": {"date": utils.utcnow()}},
    )
    await db.declaration.put(
        "87654321",
        2020,
        "foo@baz.com",
        {"déclaration": {"date": utils.utcnow()}},
    )
    await db.declaration.put(
        "87654331",
        2020,
        "foo@baz.com",
        {"déclaration": {"date": utils.utcnow(), "brouillon": True}},
    )

    records = await db.declaration.completed()
    assert len(records) == 2
    assert records[0].data.siren == "87654321"
    assert records[1].data.siren == "12345678"


async def test_declaration_data():
    now = utils.utcnow().isoformat()
    await db.declaration.put(
        "123456789",
        2020,
        "foo@bar.com",
        {"déclaration": {"date": now}},
    )
    record = await db.declaration.get("123456789", 2020)
    data = record.data
    assert data["déclaration"]["date"]
    del data["déclaration"]["date"]  # Can't compare
    assert record.data == {
        "déclaration": {
            "année_indicateurs": 2020,
        },
        "entreprise": {"siren": "123456789"},
    }
    record = (await db.declaration.completed())[0]
    data = record.data
    assert data["déclaration"]["date"]
    del data["déclaration"]["date"]  # Can't compare
    assert record.data == {
        "déclaration": {
            "année_indicateurs": 2020,
        },
        "entreprise": {"siren": "123456789"},
    }
    await db.declaration.put(
        "123456789",
        2020,
        "foo@bar.com",
        {"déclaration": {"date": now, "brouillon": True}},
    )
    record = await db.declaration.get("123456789", 2020)
    data = record.data
    assert data["déclaration"]["date"]
    del data["déclaration"]["date"]  # Can't compare
    assert record.data == {
        "déclaration": {
            "brouillon": True,
            "année_indicateurs": 2020,
        },
        "entreprise": {"siren": "123456789"},
    }
    record = (await db.declaration.completed())[0]
    data = record.data
    assert data["déclaration"]["date"]
    del data["déclaration"]["date"]  # Can't compare
    assert record.data == {
        "déclaration": {
            "année_indicateurs": 2020,
        },
        "entreprise": {"siren": "123456789"},
    }


async def test_put_declaration_should_not_update_declared_at():
    modified_at = datetime(2020, 10, 5, 4, 3, 2, tzinfo=timezone.utc)
    await db.declaration.put(
        "123456782", 2020, "foo@bar.com", {}, modified_at=modified_at
    )
    record = await db.declaration.get("123456782", 2020)
    assert record["modified_at"] == modified_at
    assert record["declared_at"] == modified_at
    assert record.data.path("déclaration.date") == modified_at.isoformat()
    await db.declaration.put("123456782", 2020, "foo@bar.com", {"source": "foo"})
    record = await db.declaration.get("123456782", 2020)
    assert record["modified_at"] != modified_at
    assert record["declared_at"] == modified_at
    assert record.data.path("déclaration.date") == modified_at.isoformat()


async def test_put_owner_should_lower_case():
    await db.ownership.put("123456782", "fOO@Bar.com")
    assert await db.ownership.emails("123456782") == ["foo@bar.com"]


async def test_declaration_owned():
    at = datetime(2021, 2, 1, 2, 3, 4, tzinfo=timezone.utc)
    await db.ownership.put("123456782", "foo@bar.com")
    await db.declaration.put(
        "123456782",
        2020,
        "foo@bar.com",
        {"entreprise": {"raison_sociale": "FooBar"}},
        modified_at=at,
    )
    await db.declaration.put(
        "123456782",
        2019,
        "foo@bar.com",
        {"entreprise": {"raison_sociale": "FooBar"}},
        modified_at=at,
    )
    data = await db.declaration.owned("foo@bar.com")
    assert data == [
        {
            "declared_at": at,
            "modified_at": at,
            "name": "FooBar",
            "siren": "123456782",
            "year": 2020,
        },
        {
            "declared_at": at,
            "modified_at": at,
            "name": "FooBar",
            "siren": "123456782",
            "year": 2019,
        },
    ]

async def test_representation_equilibree_all_ordered_by_date():
    await db.representation_equilibree.put(
        "12345678",
        2020,
        {
            "déclaration": {"année_indicateurs": 2020},
            "entreprise": {
                "raison_sociale": "Company 1",
            },
        }
    )
    await db.representation_equilibree.put(
        "87654321",
        2020,
        {
            "déclaration": {"année_indicateurs": 2020},
            "entreprise": {
                "raison_sociale": "Company 2",
            },
        }
    )
    await db.representation_equilibree.put(
        "87654331",
        2020,
        {
            "déclaration": {"année_indicateurs": 2020},
            "entreprise": {
                "raison_sociale": "Company 3",
            },
        }
    )

    records = await db.representation_equilibree.allOrderByDate()
    assert len(records) == 3
    assert records[0].data.siren == "87654331"
    assert records[1].data.siren == "87654321"
    assert records[2].data.siren == "12345678"
