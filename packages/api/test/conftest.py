import asyncio
import os
import uuid
import pytest
from roll.testing import Client as BaseClient

from egapro.views import app as egapro_app
from egapro import config as egapro_config
from egapro import db, helpers, models, tokens


def pytest_configure(config):
    async def configure():
        if os.environ.get("EGAPRO_TEST_DBHOST") is not None:
            os.environ["EGAPRO_DBHOST"] = os.environ["EGAPRO_TEST_DBHOST"]
        os.environ["EGAPRO_DBNAME"] = "test_egapro"

        egapro_config.init()
        await db.init()
        async with db.declaration.pool.acquire() as conn:
            await conn.execute("DROP TABLE IF EXISTS declaration CASCADE")
            await conn.execute("DROP TABLE IF EXISTS simulation")
            await conn.execute("DROP TABLE IF EXISTS search")
            await conn.execute("DROP TABLE IF EXISTS archive")
            await conn.execute("DROP TABLE IF EXISTS ownership")
            await conn.execute("DROP TABLE IF EXISTS representation_equilibree CASCADE")
            await conn.execute("DROP TABLE IF EXISTS search_representation_equilibree")
        await db.init()

    asyncio.run(configure())


def pytest_runtest_setup(item):
    async def setup():
        await db.init()
        # Make sure the current active database is the test one before deleting.
        async with db.declaration.pool.acquire() as conn:
            dbname = await conn.fetchval("SELECT current_database();")
        assert dbname == "test_egapro"

        # Ok, it's the test database, we can now delete the data.
        async with db.declaration.pool.acquire() as conn:
            await conn.execute("TRUNCATE TABLE declaration CASCADE;")
            await conn.execute("TRUNCATE TABLE simulation;")
            await conn.execute("TRUNCATE TABLE search;")
            await conn.execute("TRUNCATE TABLE archive;")
            await conn.execute("TRUNCATE TABLE ownership;")
            await conn.execute("TRUNCATE TABLE representation_equilibree CASCADE;")
            await conn.execute("TRUNCATE TABLE search_representation_equilibree;")
        await db.terminate()

        helpers.get_entreprise_details.cache_clear()

    asyncio.run(setup())


@pytest.fixture
def app():  # Requested by Roll testing utilities.
    return egapro_app


@pytest.fixture
def representation_equilibree():
    async def factory(
        siren="123456782",
        year=2020,
        owner="bar@foo.com",
        company="Representation Eq",
        departement="26",
        region="84",
        modified_at=None,
        **data,
    ):
        data.setdefault("entreprise", {})
        data.setdefault("déclaration", {})
        data.setdefault("déclarant", {})
        data["entreprise"].setdefault("raison_sociale", company)
        data["entreprise"].setdefault("département", departement)
        data["entreprise"].setdefault("région", region)
        data["entreprise"].setdefault("siren", siren)
        data["déclarant"].setdefault("email", owner)
        data["déclarant"].setdefault("prénom", "Martin")
        data["déclarant"].setdefault("nom", "Martine")
        await db.representation_equilibree.put(siren, year, data, modified_at=modified_at)
        await db.ownership.put(siren, owner)
        return data

    return factory


@pytest.fixture
def declaration():
    async def factory(
        siren="123456782",
        year=2020,
        owner="foo@bar.com",
        company="Total Recall",
        departement="26",
        region="84",
        grade=26,
        uid=str(uuid.uuid1()),
        compute_notes=False,
        modified_at=None,
        **data,
    ):
        data.setdefault("entreprise", {})
        data.setdefault("déclaration", {})
        data.setdefault("déclarant", {})
        data.setdefault("id", uid)
        data["entreprise"].setdefault("raison_sociale", company)
        data["entreprise"].setdefault("département", departement)
        data["entreprise"].setdefault("région", region)
        data["entreprise"].setdefault("siren", siren)
        data["entreprise"].setdefault("effectif", {"tranche": "50:250", "total": 149})
        data["déclaration"].setdefault("année_indicateurs", year)
        data["déclaration"].setdefault("index", grade)
        data["déclarant"].setdefault("email", owner)
        data["déclarant"].setdefault("prénom", "Martin")
        data["déclarant"].setdefault("nom", "Martine")
        if not data["déclaration"].get("période_suffisante") is False:
            data["déclaration"].setdefault("fin_période_référence", "2019-12-31")
            data.setdefault("indicateurs", {})
            data["indicateurs"].setdefault("rémunérations", {"mode": "csp"})
            data["indicateurs"].setdefault("congés_maternité", {})
            if data["entreprise"]["effectif"]["tranche"] == "50:250":
                data["indicateurs"].setdefault("augmentations_et_promotions", {})
            else:
                data["indicateurs"].setdefault("augmentations", {})
                data["indicateurs"].setdefault("promotions", {})
        if compute_notes:
            helpers.compute_notes(models.Data(data))
        await db.declaration.put(siren, year, owner, data, modified_at=modified_at)
        await db.ownership.put(siren, owner)
        return data

    return factory


class Client(BaseClient):
    def login(self, email):
        print(f"Login as {email}")
        token = tokens.create(email)
        self.default_headers["API-Key"] = token

    def logout(self):
        try:
            del self.default_headers["API-Key"]
        except KeyError:
            pass


@pytest.fixture
def client(app, event_loop):
    app.loop = event_loop
    app.loop.run_until_complete(app.startup())
    c = Client(app)
    c.login("foo@bar.org")
    yield c
    c.logout()
    app.loop.run_until_complete(app.shutdown())
