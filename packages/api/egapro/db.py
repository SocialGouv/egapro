from typing import KeysView, Literal, Union
import uuid
import ssl
from datetime import datetime

import asyncpg
from naf import DB as NAF
from asyncstdlib.functools import lru_cache
from asyncpg.exceptions import DuplicateDatabaseError, PostgresError
import ujson as json

from egapro import config, models, sql, utils, helpers
from egapro.constants import DEPARTEMENT_TO_REGION, DEPARTEMENTS, REGIONS, REGIONS_TO_DEPARTEMENTS
from egapro.loggers import logger


class NoData(Exception):
    pass



class Record(asyncpg.Record):
    fields = []

    def __getattr__(self, key):
        return self.get(key)

    def as_resource(self):
        return {k: getattr(self, k) for k in self.fields}


class SimulationRecord(Record):
    fields = ["id", "data", "modified_at"]


class DeclarationRecord(Record):
    fields = ["siren", "year", "data", "modified_at", "declared_at"]

    @property
    def data(self):
        data = self.get("draft") or self.get("data")
        return models.Data(data)

class RepresentationRecord(Record):
    fields = ["siren", "year", "data", "modified_at", "declared_at"]

    @property
    def data(self):
        data = self.get("data")
        return models.Data(data)

class ReferentRecord(Record):
    fields = ["id", "county", "name", "principal", "region", "type", "value"]

    @property
    def id(self) -> str:
        return self.get("id")

    @property
    def county(self) -> Union[str, None]:
        return self.get("county")

    @property
    def name(self) -> str:
        return self.get("name")

    @property
    def principal(self) -> bool:
        return bool(self.get("principal")) or False

    @property
    def region(self) -> str:
        return self.get("region")

    @property
    def type(self) -> Literal["url", "email"]:
        return self.get("type")

    @property
    def value(self) -> str:
        return self.get("value")


class table:

    pool: asyncpg.pool.Pool = None
    record_class = Record

    @classmethod
    async def fetch(cls, sql: str, *params):
        try:
            conn: asyncpg.connection.Connection
            async with cls.pool.acquire() as conn:
                return await conn.fetch(sql, *params, record_class=cls.record_class)
        except AttributeError:
            logger.warning("Database connection not initialized")
            return []

    @classmethod
    async def fetchrow(cls, sql: str, *params):
        try:
            conn: asyncpg.connection.Connection
            async with cls.pool.acquire() as conn:
                row = await conn.fetchrow(sql, *params, record_class=cls.record_class)
            if not row:
                raise NoData
            return row
        except AttributeError:
            logger.warning("Database connection not initialized")
            raise NoData

    @classmethod
    async def fetchval(cls, sql: str, *params):
        try:
            conn: asyncpg.connection.Connection
            async with cls.pool.acquire() as conn:
                row = await conn.fetchval(sql, *params)
            if row is None:
                raise NoData
            return row
        except AttributeError:
            logger.warning("Database connection not initialized")
            raise NoData

    @classmethod
    async def execute(cls, sql: str, *params):
        try:
            conn: asyncpg.connection.Connection
            async with cls.pool.acquire() as conn:
                return await conn.execute(sql, *params)
        except AttributeError:
            logger.warning("Database connection not initialized")
            return None

class referent(table):
    record_class = ReferentRecord
    table_name = "referent"

    @classmethod
    async def getPrincipalsByCounty(cls, county: str) -> list[ReferentRecord]:
        return await cls.fetch(f"SELECT * from {cls.table_name} WHERE county=$1 AND principal=TRUE", county)

    @classmethod
    async def getCoordRegion(cls, region: str) -> Union[ReferentRecord, None]:
        try:
            return await cls.fetchrow(f"SELECT * from {cls.table_name} WHERE region=$1 AND county IS NULL LIMIT 1" , region)
        except NoData:
            return None

class representation_equilibree(table):
    record_class = RepresentationRecord
    table_name = "representation_equilibree"

    @classmethod
    async def all(cls):
        return await cls.fetch(f"SELECT * from {cls.table_name}")

    @classmethod
    async def allOrderByDate(cls):
        return await cls.fetch(f"SELECT * from {cls.table_name} ORDER BY modified_at DESC")

    @classmethod
    async def get(cls, siren, year):
        return await cls.fetchrow(
            f"SELECT * FROM {cls.table_name} WHERE siren=$1 AND year=$2", siren, int(year)
        )

    @classmethod
    async def get_with_siren(cls, siren):
        print("SIREN:", siren)
        return await cls.fetchrow(
            f"SELECT * FROM {cls.table_name} WHERE siren=$1", siren
        )

    @classmethod
    async def get_declared_at(cls, siren, year):
        try:
            return await cls.fetchval(
                f"SELECT declared_at FROM {cls.table_name} WHERE siren=$1 AND year=$2",
                siren,
                int(year),
            )
        except NoData:
            return None

    @classmethod
    async def put(cls, siren, year, data, modified_at=None):
        data = models.Data(data)
        # Allow to force modified_at, eg. during migrations.
        if modified_at is None:
            modified_at = utils.utcnow()
        year = int(year)
        data.setdefault("déclaration", {})
        data["déclaration"]["année_indicateurs"] = year
        data.setdefault("entreprise", {})
        data["entreprise"]["siren"] = siren
        ft = helpers.extract_ft(data)
        declared_at = await cls.get_declared_at(siren, year)

        if not declared_at:
            declared_at = modified_at
        if declared_at:
            data["déclaration"]["date"] = declared_at.isoformat()

        query = sql.insert_representation
        args = (siren, year, modified_at, declared_at, data.raw, ft)
        async with cls.pool.acquire() as conn:
            await conn.execute(query, *args)
            await search_representation_equilibree.index(data)

    @classmethod
    def public_data(cls, data):
        data = models.Data(data)
        raison_sociale = data.company
        siren = data.siren
        out = {
            "entreprise": {
                "raison_sociale": raison_sociale,
                "siren": siren,
                "région": data.path("entreprise.région"),
                "département": data.path("entreprise.département"),
                "code_naf": data.path("entreprise.code_naf"),
            },
        }
        return out


class declaration(table):
    record_class = DeclarationRecord
    table_name = "declaration"

    @classmethod
    async def all(cls, year:int=None):
        req = f"SELECT * FROM {cls.table_name}"
        if year:
            req += f" WHERE year={year}"
        return await cls.fetch(req)

    @classmethod
    async def completed(cls):
        # Do not select draft in this request, as it must reflect the declarations state
        return await cls.fetch(
            f"SELECT data, legacy, modified_at FROM {cls.table_name} "
            "WHERE declared_at IS NOT NULL ORDER BY declared_at DESC"
        )

    @classmethod
    async def get(cls, siren, year):
        return await cls.fetchrow(
            f"SELECT * FROM {cls.table_name} WHERE siren=$1 AND year=$2", siren, int(year)
        )

    @classmethod
    async def delete(cls, siren, year):
        return await cls.execute(
            f"DELETE FROM {cls.table_name} WHERE siren=$1 AND year=$2", siren, int(year)
        )

    @classmethod
    async def get_last(cls, siren):
        return await cls.fetchrow(
            f"SELECT data FROM {cls.table_name} "
            "WHERE siren=$1 AND data IS NOT NULL ORDER BY year DESC LIMIT 1",
            siren,
        )

    @classmethod
    async def get_declared_at(cls, siren, year):
        try:
            return await cls.fetchval(
                f"SELECT declared_at FROM {cls.table_name} WHERE siren=$1 AND year=$2",
                siren,
                int(year),
            )
        except NoData:
            return None

    @classmethod
    async def put(cls, siren, year, declarant, data, modified_at=None):
        data = models.Data(data)
        # Allow to force modified_at, eg. during migrations.
        if modified_at is None:
            modified_at = utils.utcnow()
        year = int(year)
        data.setdefault("déclaration", {})
        data["déclaration"]["année_indicateurs"] = year
        data.setdefault("entreprise", {})
        data["entreprise"]["siren"] = siren
        ft = helpers.extract_ft(data)
        declared_at = await cls.get_declared_at(siren, year)
        if not declared_at and not data.is_draft():
            declared_at = modified_at
        if declared_at:
            data["déclaration"]["date"] = declared_at.isoformat()
        if data.is_draft():
            query = sql.insert_draft_declaration
            args = (siren, int(year), modified_at, declarant, data.raw)
        else:
            query = sql.insert_declaration
            args = (siren, year, modified_at, declared_at, declarant, data.raw, ft)
        async with cls.pool.acquire() as conn:
            await conn.execute(query, *args)
            if not data.is_draft():
                await search.index(data)

    @classmethod
    async def owned(cls, owner):
        sirens = await ownership.sirens(owner)
        return [
            cls.metadata(r)
            for r in await cls.fetch(
                f"SELECT * FROM {cls.table_name} WHERE siren = any($1::text[])", sirens
            )
        ]

    @classmethod
    def metadata(cls, record):
        return {
            "modified_at": record["modified_at"],
            "declared_at": record["declared_at"],
            "siren": record["siren"],
            "year": record["year"],
            "name": record.data.company,
        }

    @classmethod
    def public_entreprise_data(cls, data):
        data = models.Data(data)
        raison_sociale = data.company
        siren = data.siren
        ues = data.path("entreprise.ues")
        if ues:
            ues["entreprises"].insert(
                0, {"raison_sociale": raison_sociale, "siren": siren}
            )
        out = {
            "entreprise": {
                "raison_sociale": raison_sociale,
                "siren": siren,
                "région": data.path("entreprise.région"),
                "département": data.path("entreprise.département"),
                "code_naf": data.path("entreprise.code_naf"),
                "ues": ues,
                "effectif": {"tranche": data.path("entreprise.effectif.tranche")},
            },
        }
        return out

    @classmethod
    def public_data(cls, data):
        out = models.Data(data)
        out.delete_path("source")
        out.delete_path("déclarant")
        out.delete_path("entreprise.adresse")
        out.delete_path("entreprise.commune")
        out.delete_path("entreprise.code_postal")
        out.delete_path("entreprise.plan_relance")
        out["entreprise"].update(région=REGIONS.get(out.path("entreprise.région")))
        out["entreprise"].update(département=DEPARTEMENTS.get(out.path("entreprise.département")))

        indic_promotions: dict = out["indicateurs"].get("promotions", {})
        indic_augmentations_et_promotions: dict = out["indicateurs"].get("augmentations_et_promotions", {})
        indic_rémunérations: dict = out["indicateurs"].get("rémunérations", {})
        indic_congés_maternité: dict = out["indicateurs"].get("congés_maternité", {})
        indic_hautes_rémunérations: dict = out["indicateurs"].get("hautes_rémunérations", {})
        out["indicateurs"] = {
            "promotions": {
                "non_calculable": indic_promotions.get("non_calculable"),
                "note": indic_promotions.get("note"),
                "objectif_de_progression": indic_promotions.get("objectif_de_progression")
            },
            "augmentations_et_promotions": {
                "non_calculable": indic_augmentations_et_promotions.get("non_calculable"),
                "note": indic_augmentations_et_promotions.get("note"),
                "objectif_de_progression": indic_augmentations_et_promotions.get("objectif_de_progression")
            },
            "rémunérations": {
                "non_calculable": indic_rémunérations.get("non_calculable"),
                "note": indic_rémunérations.get("note"),
                "objectif_de_progression": indic_rémunérations.get("objectif_de_progression")
            },
            "congés_maternité": {
                "non_calculable": indic_congés_maternité.get("non_calculable"),
                "note": indic_congés_maternité.get("note"),
                "objectif_de_progression": indic_congés_maternité.get("objectif_de_progression")
            },
            "hautes_rémunérations": {
                "non_calculable": indic_hautes_rémunérations.get("non_calculable"),
                "note": indic_hautes_rémunérations.get("note"),
                "objectif_de_progression": indic_hautes_rémunérations.get("objectif_de_progression"),
                "résultat": indic_hautes_rémunérations.get("résultat"),
                "population_favorable": indic_hautes_rémunérations.get("population_favorable")
            }
        }

        declaration: dict = out["déclaration"]
        out.delete_path("déclaration")
        out["déclaration"] = {
            "index": declaration.get("index"),
            "année_indicateurs": declaration["année_indicateurs"],
            "mesures_correctives": declaration.get("mesures_correctives")
        }

        return out


class ownership(table):
    table_name = "ownership"

    @classmethod
    async def put(cls, siren, email):
        email = email.lower()
        async with cls.pool.acquire() as conn:
            created = await conn.fetchval(
                f"INSERT INTO {cls.table_name} (siren, email) VALUES ($1, $2) "
                "ON CONFLICT DO NOTHING RETURNING true",
                siren,
                email,
            )
        if created:
            logger.info(f"Adding owner for {siren}: {email}")

    @classmethod
    async def delete(cls, siren, email):
        async with cls.pool.acquire() as conn:
            deleted = await conn.fetchval(
                f"DELETE FROM {cls.table_name} WHERE siren=$1 AND email=$2 RETURNING true",
                siren,
                email,
            )
        if deleted:
            logger.info(f"Deleting owner for {siren}: {email}")

    @classmethod
    async def emails(cls, siren):
        records = await cls.fetch(f"SELECT email FROM {cls.table_name} WHERE siren=$1", siren)
        return [r["email"] for r in records]

    @classmethod
    async def sirens(cls, email):
        records = await cls.fetch(f"SELECT siren FROM {cls.table_name} WHERE email=$1", email)
        return [r["siren"] for r in records]


class simulation(table):
    record_class = SimulationRecord
    table_name = "simulation"

    @classmethod
    async def get(cls, uuid):
        return await cls.fetchrow(f"SELECT * FROM {cls.table_name} WHERE id=$1", uuid)

    @classmethod
    async def put(cls, uuid, data, modified_at=None):
        # Allow to force modified_at, eg. during migrations.
        if modified_at is None:
            modified_at = utils.utcnow()
        async with cls.pool.acquire() as conn:
            await conn.execute(
                f"INSERT INTO {cls.table_name} (id, modified_at, data) VALUES ($1, $2, $3) "
                "ON CONFLICT (id) DO UPDATE SET modified_at = $2, data = $3",
                uuid,
                modified_at,
                data,
            )

    @classmethod
    async def create(cls, data):
        uid = str(uuid.uuid1())
        try:
            await cls.get(uid)
        except NoData:
            await cls.put(uid, data)
            return uid
        return await cls.create(data)


class search(table):
    @classmethod
    async def index(cls, data):
        ft = helpers.extract_ft(data)
        siren = data.siren
        year = data.year
        region = data.path("entreprise.région")
        departement = data.path("entreprise.département")
        code_naf = data.path("entreprise.code_naf")
        section_naf = None
        if code_naf:
            try:
                section_naf = NAF[code_naf].section.code
            except KeyError:
                pass
        note = data.path("déclaration.index")
        declared_at = datetime.fromisoformat(data.path("déclaration.date"))
        async with cls.pool.acquire() as conn:
            try:
                await conn.execute(
                    sql.index_declaration,
                    siren,
                    year,
                    declared_at,
                    ft,
                    region,
                    departement,
                    section_naf,
                    note,
                )
            except PostgresError as err:
                logger.error(f"Cannot index {siren}/{year}: {err}")

    @classmethod
    def as_json(cls, row, query):
        row = dict(row)
        data = row.pop("data")[0]
        return {
            **declaration.public_entreprise_data(data),
            **dict(row),
            "label": cls.compute_label(query, data),
        }

    @classmethod
    @lru_cache(maxsize=1024)
    async def run(cls, query=None, limit=10, offset=0, **filters):
        args = [limit, offset]
        args, where = cls.build_query(args, query, **filters)
        rows = await cls.fetch(sql.search.format(where=where), *args)
        return [cls.as_json(row, query) for row in rows]

    @classmethod
    @lru_cache(maxsize=128)
    async def stats(cls, year, **filters):
        args = [year]
        args, where = cls.build_query(args, **filters)
        return await cls.fetchrow(sql.search_stats.format(where=where), *args)

    @classmethod
    async def count(cls, query=None, **filters):
        tpl = "SELECT COUNT(DISTINCT(siren)) as count FROM search {where}"
        args, where = cls.build_query([], query, **filters)
        return await cls.fetchval(tpl.format(where=where), *args)

    @staticmethod
    def build_query(args, query=None, **filters):
        where = []
        if query and len(query) == 9 and query.isdigit():
            filters["siren"] = query
            query = None
        elif query:
            query = utils.prepare_query(query)
            args.append(query)
            where.append(f"search.ft @@ to_tsquery('ftdict', ${len(args)})")
        for name, value in filters.items():
            if value is not None:
                if (type(value) is tuple):
                    tuple_idx = []
                    for elt in value:
                        args.append(elt)
                        tuple_idx.append(f"${len(args)}")
                    where.append(f"search.{name} in ({', '.join(tuple_idx)})")
                else:
                    args.append(value)
                    where.append(f"search.{name}=${len(args)}")
        if where:
            where = "WHERE " + " AND ".join(where)
        return args, where or ""

    @classmethod
    async def truncate(cls):
        await cls.execute("TRUNCATE table search")

    @classmethod
    def compute_label(cls, query, data):
        entreprise = data["entreprise"]
        declarante = entreprise.get("raison_sociale")
        ues = entreprise.get("ues", {})
        nom_ues = ues.get("nom")
        others = ues.get("entreprises")
        if not nom_ues or not others or not query:
            return declarante
        others = [o["raison_sociale"] for o in others]
        return helpers.compute_label(query, nom_ues, declarante, *others)

class search_representation_equilibree(table):
    table_name = "search_representation_equilibree"

    @classmethod
    async def index(cls, data: models.Data):
        ft = helpers.extract_ft(data)
        siren = data.siren
        year = data.year
        region = data.path("entreprise.région")
        departement = data.path("entreprise.département")
        code_naf = data.path("entreprise.code_naf")
        section_naf = None
        if code_naf:
            try:
                section_naf = NAF[code_naf].section.code
            except KeyError:
                pass
        declared_at = datetime.fromisoformat(data.path("déclaration.date"))
        async with cls.pool.acquire() as conn:
            try:
                await conn.execute(
                    sql.index_representation_equilibree,
                    siren,
                    year,
                    declared_at,
                    ft,
                    region,
                    departement,
                    section_naf,
                )
            except PostgresError as err:
                logger.error(f"Cannot index representation equilibree {siren}/{year}: {err}")

    @classmethod
    def as_json(cls, row, query):
        row = dict(row)
        data = row.pop("data")[0]
        return {
            **representation_equilibree.public_data(data),
            **dict(row),
            "label": data["entreprise"].get("raison_sociale"),
        }

    @classmethod
    @lru_cache(maxsize=1024)
    async def run(cls, query: Union[str, None] = None, limit=10, offset=0, **filters: str):
        args = [limit, offset]
        args, where = cls.build_query(args, query, **filters)
        rows = await cls.fetch(sql.search_representation_equilibree.format(where=where), *args)
        return [cls.as_json(row, query) for row in rows]

    @classmethod
    async def count(cls, query=None, **filters):
        tpl = "SELECT COUNT(DISTINCT(siren)) as count FROM {table} {where}"
        args, where = cls.build_query([], query, **filters)
        return await cls.fetchval(tpl.format(where=where, table=cls.table_name), *args)

    @staticmethod
    def build_query(args: list[str], query: Union[str, None] = None, **filters: str):
        where = []
        table_name = search_representation_equilibree.table_name

        if query and len(query) == 9 and query.isdigit():
            filters["siren"] = query
            query = None
        elif query:
            query = utils.prepare_query(query)
            args.append(query)
            where.append(f"{table_name}.ft @@ to_tsquery('ftdict', ${len(args)})")
        for name, value in filters.items():
            if value is not None:
                if (type(value) is tuple):
                    tuple_idx = []
                    for elt in value:
                        args.append(elt)
                        tuple_idx.append(f"${len(args)}")
                    where.append(f"{table_name}.{name} in ({', '.join(tuple_idx)})")
                else:
                    args.append(value)
                    where.append(f"{table_name}.{name}=${len(args)}")
        if where:
            where = "WHERE " + " AND ".join(where)
        return args, where or ""

    @classmethod
    async def truncate(cls):
        await cls.execute(f"TRUNCATE table {cls.table_name}")

class archive(table):
    @classmethod
    async def put(cls, siren, year, data, by=None, ip=None):
        async with cls.pool.acquire() as conn:
            await conn.execute(sql.insert_archive, siren, year, data, by, ip)

    @classmethod
    async def list(cls, siren, year):
        return await cls.fetch(
            "SELECT * FROM archive WHERE siren=$1 AND year=$2 ORDER BY at", siren, year
        )


async def set_type_codecs(conn):
    await conn.set_type_codec(
        "jsonb", encoder=json.dumps, decoder=json.loads, schema="pg_catalog"
    )
    await conn.set_type_codec("uuid", encoder=str, decoder=str, schema="pg_catalog")


async def init():
    try:
        table.pool = await asyncpg.create_pool(
            database=config.DBNAME,
            host=config.DBHOST,
            port=config.DBPORT,
            user=config.DBUSER,
            password=config.DBPASS,
            min_size=config.DBMINSIZE,
            max_size=config.DBMAXSIZE,
            init=set_type_codecs,
            ssl=config.DBSSL,
        )
    except (OSError, PostgresError) as err:
        raise RuntimeError(f"CRITICAL Cannot connect to DB: {err}")
    async with table.pool.acquire() as conn:
        await conn.execute(sql.init)
        await conn.execute(sql.create_indexes)


async def create_indexes():
    async with table.pool.acquire() as conn:
        await conn.execute(sql.create_indexes)


async def create():
    conn = await asyncpg.connect(
        database="template1",
        host=config.DBHOST,
        port=config.DBPORT,
        user=config.DBUSER,
        password=config.DBPASS,
        ssl=config.DBSSL,
    )
    # Asure username is in the form user@servername.
    user = config.DBUSER.split("@")[0]
    try:
        await conn.fetch(f"CREATE DATABASE {config.DBNAME} OWNER {user};")
    except DuplicateDatabaseError as err:
        print(err)
    else:
        print(f"Created database {config.DBNAME} for user {user}")
    await conn.close()


async def terminate():
    try:
        if table.pool is not None:
            await table.pool.close()
            table.pool = None
            logger.info("Database connection pool closed")
    except AttributeError:
        logger.warning("Database connection was not initialized")
