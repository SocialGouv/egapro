import json

import pytest

from egapro import db

pytestmark = pytest.mark.asyncio


async def test_get_owners(client):
    await db.ownership.put("123456782", "foo@bar.baz")
    await db.ownership.put("123456782", "boo@bar.baz")
    client.login("someone@else.baz")
    resp = await client.get("/ownership/123456782")
    assert resp.status == 403
    client.login("FoO@BAR.baZ")
    resp = await client.get("/ownership/123456782")
    assert resp.status == 200
    data = json.loads(resp.body)
    assert "owners" in data
    assert sorted(data["owners"]) == ["boo@bar.baz", "foo@bar.baz"]


async def test_add_owner(client, monkeypatch):
    client.login("FoO@BAR.baZ")
    resp = await client.put("/ownership/123456782/foo@foo.foo")
    assert resp.status == 403
    await db.ownership.put("123456782", "foo@bar.baz")
    client.login("someone@else.baz")
    resp = await client.put("/ownership/123456782/foo@foo.foo")
    assert resp.status == 403
    client.login("FoO@BAR.baZ")
    resp = await client.put("/ownership/123456782/foo@foo.foo")
    assert resp.status == 204
    assert sorted(await db.ownership.emails("123456782")) == sorted(["foo@bar.baz", "foo@foo.foo"])
    monkeypatch.setattr("egapro.config.STAFF", ["staff@email.com"])
    client.login("staff@email.com")
    resp = await client.put("/ownership/123456782/ba@na.na")
    assert resp.status == 204
    inserted = await db.ownership.emails("123456782")
    assert len(inserted) == 3
    assert "foo@bar.baz" in inserted
    assert "foo@foo.foo" in inserted
    assert "ba@na.na" in inserted


async def test_delete_owner(client):
    await db.ownership.put("123456782", "bar@bar.bar")
    await db.ownership.put("123456782", "foo@foo.foo")
    client.login("someone@else.baz")
    resp = await client.delete("/ownership/123456782/foo@foo.foo")
    assert resp.status == 403
    client.login("bAR@BAR.Bar")
    resp = await client.delete("/ownership/123456782/foo@foo.foo")
    assert resp.status == 204
    assert await db.ownership.emails("123456782") == ["bar@bar.bar"]
    resp = await client.delete("/ownership/123456782/bar@bar.bar")
    assert resp.status == 403
    assert await db.ownership.emails("123456782") == ["bar@bar.bar"]
