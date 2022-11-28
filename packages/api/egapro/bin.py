import sys
import urllib.request
from collections import Counter
from datetime import date
from importlib import import_module
from io import BytesIO
from pathlib import Path

import minicli
import progressist
import yaml
import ujson as json
from openpyxl import load_workbook

from egapro import (
    config,
    constants,
    db,
    dgt,
    dgt_representation,
    csv_representation,
    emails,
    exporter,
    helpers,
    models,
    schema,
    tokens,
    loggers,
)
from egapro.pdf import declaration as declaration_receipt
from egapro.exporter import dump  # pyright: ignore
from egapro.utils import json_dumps


@minicli.cli
async def export_representation(path: Path, max_rows: int = None):
    wb = await csv_representation.as_xlsx(max_rows)
    print("Writing the dgt XLSX to", path)
    wb.save(path)


@minicli.cli
async def dump_dgt(path: Path, max_rows: int = None):
    wb = await dgt.as_xlsx(max_rows)
    print("Writing the dgt XLSX to", path)
    wb.save(path)


@minicli.cli
async def dump_dgt_representation(path: Path, max_rows: int = None):
    wb = await dgt_representation.as_xlsx(max_rows)
    print("Writing the dgt_representation XLSX to", path)
    wb.save(path)


@minicli.cli
async def search(q, verbose=False):
    rows = await db.search.run(q)
    for row in rows:
        data = models.Data(row)
        print(f"{data.siren} | {data.year} | {data.company}")
        if verbose:
            print(row)

@minicli.cli
async def search_representation_equilibree(q, verbose=False):
    rows = await db.search_representation_equilibree.run(q)
    for row in rows:
        data = models.Data(row)
        print(f"{data.siren} | {data.year} | {data.company}")
        if verbose:
            print(row)


@minicli.cli
async def export_public_data(path: Path):
    print("Writing the CSV to", path)
    with path.open("w") as f:
        await exporter.public_data(f)
    print("Done")


@minicli.cli
async def export_indexes(path: Path):
    print("Writing the CSV to", path)
    with path.open("w") as f:
        await exporter.indexes(f)
    print("Done")


@minicli.cli
async def full(path: Path):
    """Create a full JSON export."""
    print("Writing to", path)
    with path.open("w") as f:
        await exporter.full(f)
    print("Done")


@minicli.cli
async def migrate(*migrations):
    ROOT = Path(__file__).parent / "migrations"

    if not migrations or migrations[0] == "list":
        for path in sorted(ROOT.iterdir()):
            if path.stem[0].isdigit():
                print(path.stem)
        sys.exit()

    for name in migrations:
        print(f"Running {name}")
        if (ROOT / f"{name}.py").exists():
            module = import_module(f"egapro.migrations.{name}")
            await module.main(db, loggers.logger)
        elif (ROOT / f"{name}.sql").exists():
            res = await db.table.execute((ROOT / f"{name}.sql").read_text())
            print(res)
        else:
            raise ValueError(f"There is no migration {name}")

        print(f"Done {name}")


@minicli.cli
async def create_db():
    """Create PostgreSQL database."""
    await db.create()


@minicli.cli
async def create_indexes():
    """Create DB indexes."""
    await db.create_indexes()


@minicli.cli
async def reindex():
    """Reindex Full Text search."""
    await db.search.truncate()
    records_declaration = await db.declaration.completed()
    bar_declaration = progressist.ProgressBar(prefix="Reindexing declarations", total=len(records_declaration), throttle=100)
    for record in bar_declaration.iter(records_declaration):
        await db.search.index(record.data)
    await db.search_representation_equilibree.truncate()
    records_reprensentation_equilibree = await db.representation_equilibree.all()
    bar_reprensentation_equilibree = progressist.ProgressBar(prefix="Reindexing representation equilibree", total=len(records_reprensentation_equilibree), throttle=100)
    for record in bar_reprensentation_equilibree.iter(records_reprensentation_equilibree):
        await db.search_representation_equilibree.index(record.data)


@minicli.cli
def serve(reload=False):
    """Run a web server (for development only)."""
    print("Dans le SERVE XXX")

    from roll.extensions import simple_server

    from .views import app

    if reload:
        import hupper

        hupper.start_reloader("egapro.bin.serve")
    simple_server(app, port=2626)


@minicli.cli
async def validate(pdb=False, verbose=False):
    from egapro.schema import validate, cross_validate

    errors = Counter()
    for row in await db.declaration.completed():
        data = json.loads(json_dumps(row.data.raw))
        try:
            validate(data)
            cross_validate(data)
        except ValueError as err:
            sys.stdout.write("×")
            errors[str(err)] += 1
            if verbose:
                print(f"\n\nERROR WITH {row['siren']}/{row['year']}\n")
                print(err)
            if pdb:
                breakpoint()
                break
            continue
        sys.stdout.write("·")
    print(errors)


@minicli.cli
async def explore(*siren_year):
    """Explore déclarations

    Usage: egapro explore [siren, year[, siren, year…]]

    Without any arguments, will return metadata for last 10 déclarations.
    Otherwise, pass siren, year pairs to get déclarations détailled data.
    """
    if not siren_year:
        records = await db.declaration.fetch(
            "SELECT * FROM declaration ORDER BY modified_at DESC LIMIT 10"
        )
        print("# Latest déclarations")
        print("| siren     | year | modified_at      | declared_at      | declarant")
        for record in records:
            declared_at = (
                str(record["declared_at"])[:16] if record["declared_at"] else "-" * 16
            )
            print(
                f"| {record['siren']} | {record['year']} | {str(record['modified_at'])[:16]} | {declared_at} | {record['declarant']}"
            )
        return
    for siren, year in zip(siren_year[::2], siren_year[1::2]):
        record = await db.declaration.get(siren, year)
        sep = "—" * 80
        print(f"Data for {siren} {year}")
        for root in [
            "indicateurs.hautes_rémunérations",
            "indicateurs.congés_maternité",
            "indicateurs.promotions",
            "indicateurs.augmentations_et_promotions",
            "indicateurs.augmentations",
            "indicateurs.rémunérations",
            "entreprise",
            "déclaration",
            "déclarant",
        ]:
            print(sep)
            print(f"# {root}")
            sequence = record.data.path(root)
            if not sequence:
                print("—")
                continue
            for key, value in sequence.items():
                print(f"{key:<20} | {value}")
        print(sep)
        for key in ["modified_at", "declared_at", "declarant"]:
            print(f"{key:<20} | {record[key]}")


@minicli.cli
async def dump_one(siren, year, destination: Path = None):
    declaration = await db.declaration.get(siren, year)
    blob = yaml.dump(dict(declaration), default_flow_style=False, allow_unicode=True)
    if destination:
        destination.write_text(blob)
        print(f"Saved to {destination}!")
    else:
        print(blob)


@minicli.cli
async def load_one(path: Path):
    record = yaml.safe_load(path.read_text())
    siren = record["siren"]
    year = record["year"]
    declarant = record["declarant"]
    data = record.get("draft") or record["data"]
    await db.declaration.put(siren, year, declarant, data)
    print("Done!")


@minicli.cli
async def set_declarant(siren, year: int, email):
    res = await db.declaration.execute(
        "UPDATE declaration SET declarant=$3, "
        "data = jsonb_set(data, '{déclarant,email}', to_jsonb($3::text)) "
        "WHERE siren=$1 AND year=$2",
        siren,
        year,
        email,
    )
    print("Done!", res)


@minicli.cli
async def add_owners(siren, *owners):
    for owner in owners:
        await db.ownership.put(siren, owner)
    print("Done!")


@minicli.cli
async def owners(siren):
    print(f"Owners for {siren}:")
    print(await db.ownership.emails(siren))


@minicli.cli
async def ownership(email):
    print(f"Ownership of {email}:")
    print(await db.ownership.sirens(email))


@minicli.cli
async def replace_siren(year: int, old, new):
    res = await db.declaration.execute(
        "UPDATE declaration "
        "SET siren=$3::text, "
        "data=jsonb_set(data, '{entreprise,siren}', to_jsonb($3)) "
        "WHERE year=$1 AND siren=$2",
        year,
        old,
        new,
    )
    print(res)


@minicli.cli
def read_token(token):
    print("—" * 20)
    print(tokens.read(token))
    print("—" * 20)


@minicli.cli
def compute_reply_to():
    URL = (
        "https://travail-emploi.gouv.fr/IMG/xlsx/referents_egalite_professionnelle.xlsx"
    )
    with urllib.request.urlopen(URL) as response:
        wb = load_workbook(BytesIO(response.read()))
    ws = wb.active
    referents = {}
    for line in ws.values:
        if line[1] and line[4] and "@" in line[4]:
            dep = line[1]
            if dep in referents:
                continue
            name = line[3].split("\n")[0].strip() if line[3] else f"Egapro {line[2]}"
            email = line[4]
            referents[dep] = f"{name} <{email}>"
    blob = yaml.dump(referents, default_flow_style=False, allow_unicode=True)
    destination = Path(__file__).parent / "emails/reply_to.yml"
    destination.write_text(blob)

    missing = set(constants.DEPARTEMENTS.keys()) - set(referents.keys())
    print(f"Missing departements: {missing}")


@minicli.cli
async def receipt(siren, year, destination=None):
    record = await db.declaration.get(siren, year)
    data = {"modified_at": record["modified_at"], **record.data}
    pdf, _ = declaration_receipt.main(data)
    print(pdf.output(destination) or f"Saved to {destination}")


@minicli.cli("from_", name="from")
async def resend_receipts(
    siren=[], from_=None, recipient=None, year=constants.CURRENT_YEAR
):
    """Resend receipt for a list of sirens in the current year

    :siren:    List of sirens to resend receipts to
    :from:      Start date (YYYY-MM-DD) to consider declarations candidates
    :recipient: Send receipts to this address (eg. for validation/testing)
    :year:      Which year to consider (default: current)
    """
    if siren:
        sql = (
            "SELECT data, modified_at, declarant FROM declaration "
            "WHERE year=$1 AND siren = any($2::text[])",
            year,
            tuple(siren),
        )
    elif from_:
        sql = (
            "SELECT data, modified_at, declarant FROM declaration "
            "WHERE declared_at>=$1 ORDER BY declared_at ASC",
            date.fromisoformat(from_),
        )
    else:
        sys.exit("Must give siren list or from date")
    records = await db.declaration.fetch(*sql)
    if not records:
        sys.exit("Nothing to send!")
    for record in records:
        data = record.data
        url = config.DOMAIN + data.uri
        recipient_ = recipient or record["declarant"]
        try:
            emails.success.send(
                recipient_,
                url=url,
                modified_at=record["modified_at"],
                **data,
            )
        except Exception as ex:
            print(ex)
            print(data)
            continue


@minicli.cli
async def history(siren, year: int, verbose=False):
    records = await db.archive.list(siren, year)
    for record in records:
        print("-" * 80)
        print("By {by} at {at} from {ip}".format(**record))
        data = yaml.dump(record["data"], default_flow_style=False, allow_unicode=True)
        if verbose:
            print(data)


@minicli.cli
def shell():
    """Run an ipython already connected to PSQL."""
    try:
        from IPython import start_ipython
    except ImportError:
        print('IPython is not installed. Type "pip install ipython"')
    else:
        start_ipython(
            argv=[],
            user_ns={
                "db": db,
                "config": config,
                "schema": schema,
            },
        )


@minicli.cli
async def sync_address(limit=100, offset=0):
    rows = await db.declaration.fetch(
        "SELECT siren, data, modified_at, declarant FROM declaration "
        "WHERE year=2020 AND data IS NOT NULL ORDER BY modified_at LIMIT $1 OFFSET $2",
        limit or None,
        offset,
    )
    bar = progressist.ProgressBar(prefix="Syncing", total=len(rows))
    # Keep a cache, just in case we need a full rerun quickly.
    ROOT = Path(".").parent / "tmp/api_entreprise"
    ROOT.mkdir(exist_ok=True)
    for idx, row in enumerate(bar.iter(rows)):
        siren = row["siren"]
        data = row["data"]
        dest = ROOT / f"{siren}.json"
        if not dest.exists():
            try:
                new = await helpers.get_entreprise_details(siren)
            except ValueError as err:
                print(siren, err)
                continue
            if new:
                dest.write_text(json_dumps(new))
        else:
            new = json.loads(dest.read_text())
        if not new:
            continue
        row["data"]["entreprise"].update(new)
        await db.declaration.put(
            siren,
            2020,
            declarant=row["declarant"],
            data=data,
            modified_at=row["modified_at"],
        )


@minicli.wrap
async def wrapper():
    loggers.init()
    config.init()
    try:
        await db.init()
    except RuntimeError as err:
        print(err)
    yield
    await db.terminate()


def main():
    minicli.run()
