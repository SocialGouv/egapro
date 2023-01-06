import sys
from functools import wraps
from traceback import print_exc

from naf import DB as NAF
from roll import Roll, HttpError
from roll import Request as BaseRequest, Response
from asyncpg.exceptions import DataError
from roll.extensions import cors, options
from stdnum.fr.siren import is_valid as siren_is_valid

from egapro import config, constants, db, emails, helpers, models, tokens, utils, schema, pdf
from egapro import loggers

class Request(BaseRequest):
    def __init__(self, *args, **kwargs):
        self._data = None
        super().__init__(*args, **kwargs)

    @property
    def json(self):
        data = super().json
        if not isinstance(data, dict):
            raise HttpError(400, "`data` doit être de type objet JSON")
        id_ = data.get("id")
        if "data" in data:
            data = data["data"]
        # Legacy identifier, be defensive and try hard to find it.
        if "id" not in data and id_:
            data["id"] = id_
        return data

    @property
    def data(self):
        if self._data is None:
            self._data = models.Data(self.json)
        return self._data

    @property
    def domain(self):
        domain = self.origin or f"https://{self.host}"
        if domain.endswith("/"):
            domain += domain[:-1]
        return domain

    @property
    def ip(self):
        return self.headers.get("X-REAL-IP")


class App(Roll):
    Request = Request


app = App()
cors(app, methods="*", headers=["*", "Content-Type"], credentials=True)
options(app)


@app.listen("error")
async def json_error_response(request, response, error):
    if error.status == 500:  # This error as not yet been caught
        if isinstance(error.__context__, DataError):
            response.status = 400
            error.message = f"Invalid data: {error.__context__}"
        elif isinstance(error.__context__, db.NoData):
            response.status = 404
            error.message = f"Resource not found: {error.__context__}"
        elif isinstance(error.__context__, ValueError):
            response.status = 422
            loggers.log_request(request)
            loggers.logger.error(str(error.__context__))
        else:
            loggers.log_request(request)
            print_exc()
    if isinstance(error.message, (str, bytes)):
        error.message = {"error": error.message}
    response.json = error.message


@app.listen("headers")
async def on_headers(request, response):
    if not config.READONLY:
        return
    if request.method not in ["GET", "OPTIONS"]:
        raise HttpError(405, "Ooops, le site est en maintenance")

def add_error(err_type, err_msg):
    def decorator(view):
        @wraps(view)
        async def wrapper(request, response, siren, *args, **kwargs):
            request["error"] = (err_type, err_msg)
            return await view(request, response, siren, *args, **kwargs)
        return wrapper
    return decorator

def ensure_owner(view):
    @wraps(view)
    async def wrapper(request, response, siren, *args, **kwargs):
        declarant = request["email"]
        owners = await db.ownership.emails(siren)
        if declarant in owners:
            request["is_owner"] = True
        # Allow to create a declaration for a siren without any owner yet.
        elif owners:
            loggers.logger.debug(
                "Non owner (%s) accessing owned resource %s %s", declarant, siren, args
            )
            if not request["staff"]:
                if "error" not in request:
                    msg = f"Vous n'avez pas les droits nécessaires pour le siren {siren}"
                    raise HttpError(403, msg)
                else:
                    raise HttpError(*request["error"])
        return await view(request, response, siren, *args, **kwargs)

    return wrapper


@app.route("/healthz", methods=["GET"])
async def healthz(request, response):
    response.status = 200
    response.json = {"message": "OK"}


@app.route("/declaration/{siren:digit}/{year:digit}", methods=["PUT"])
@tokens.require
@ensure_owner
async def declare(request, response, siren, year):
    try:
        year = int(year)
    except ValueError:
        raise HttpError(422, f"Ce n'est pas une année valide: `{year}`")
    if not siren_is_valid(siren):
        raise HttpError(422, f"Numéro SIREN invalide: {siren}")
    if year not in constants.YEARS:
        years = ", ".join([str(y) for y in constants.YEARS])
        raise HttpError(
            422, f"Il est possible de déclarer seulement pour les années {years}"
        )
    data = request.data
    declarant = request["email"]
    data.setdefault("déclarant", {})
    # Use token email as default for declarant email.
    if not data["déclarant"].get("email"):
        data["déclarant"]["email"] = declarant
    schema.validate(data.raw)
    helpers.compute_notes(data)
    schema.cross_validate(data.raw)
    try:
        current = await db.declaration.get(siren, year)
    except db.NoData:
        current = None
    else:
        # Do not force new declarant, in case this is a staff person editing
        declarant = current["declarant"]
        declared_at = current["declared_at"]
        expired = declared_at and declared_at < utils.remove_one_year(utils.utcnow())
        if expired and not request["staff"]:
            raise HttpError(403, "Le délai de modification est écoulé.")
    await db.declaration.put(siren, year, declarant, data)
    response.status = 204
    if data.validated:
        await db.archive.put(siren, year, data, by=request["email"], ip=request.ip)
        if not request["staff"]:
            await db.ownership.put(siren, request["email"])
        # Do not send the success email on update for now (we send too much emails that
        # are unwanted, mainly because when someone loads the frontend app a PUT is
        # automatically sent, without any action from the user.)
        loggers.logger.info(f"{siren}/{year} BY {declarant} FROM {request.ip}")
        if not current or not current.data.validated:
            owners = await db.ownership.emails(siren)
            if not owners:  # Staff member
                owners = request["email"]
            url = request.domain + data.uri
            emails.success.send(owners, url=url, **data)

@app.route("/representation-equilibree/{siren:digit}", methods=["GET"])
@tokens.require
@ensure_owner
async def get_representation_equilibrees(request, response, siren):
    declarations = []
    limit = request.query.int("limit", 10)
    years = sorted(constants.YEARS, reverse=True)

    for year in years:
        try:
            record = await db.representation_equilibree.get(siren, year)

            resource = record.as_resource()
            if record.data.path("déclarant.nom"):
                await helpers.patch_from_recherche_entreprises(resource["data"])
            declarations.append(resource)
        except:
            pass
        if len(declarations) == limit:
            break

    if not declarations:
        raise HttpError(404, f"No representation equilibree with siren {siren} for any year")
    response.json = declarations

@app.route("/declarations/{siren:digit}", methods=["GET"])
@tokens.require
@ensure_owner
async def get_declarations(request, response, siren):
    declarations = []
    limit = request.query.int("limit", 10)
    years = sorted(constants.YEARS, reverse=True)

    for year in years:
        try:
            record = await db.declaration.get(siren, year)

            resource = record.as_resource()
            if record.data.path("déclarant.nom"):
                await helpers.patch_from_recherche_entreprises(resource["data"])
            declarations.append(resource)
        except:
            pass
        if len(declarations) == limit:
            break

    if not declarations:
        raise HttpError(404, f"No declarations with siren {siren} for any year")
    response.json = declarations

@app.route("/public/declaration", methods=["GET"])
async def get_public_all_declarations(request, response):
    declarations = []
    limit = request.query.int("limit", 10)
    years = sorted(constants.YEARS, reverse=True)

    stop_fetching = False
    for year in years:
        try:
            records = await db.declaration.all(year)

            for record in records:
                try:
                    resource: models.Data = record.as_resource()
                    if record.data.path("déclaration.brouillon"):
                        pass
                    declarations.append(db.declaration.public_data(resource["data"]))
                    stop_fetching = len(declarations) == limit
                except:
                    pass
                if stop_fetching:
                    break
        except:
            pass
        if stop_fetching:
            break

    if not declarations:
        raise HttpError(404, f"No declarations for any year")
    response.json = declarations

@app.route("/public/declaration/{siren:digit}", methods=["GET"])
async def get_public_declarations(request, response, siren):
    declarations = []
    limit = request.query.int("limit", 10)
    years = sorted(constants.YEARS, reverse=True)

    for year in years:
        try:
            record = await db.declaration.get(siren, year)
            resource: models.Data = record.as_resource()
            if record.data.path("déclaration.brouillon"):
                pass
            declarations.append(db.declaration.public_data(resource["data"]))
        except:
            pass
        if len(declarations) == limit:
            break

    if not declarations:
        raise HttpError(404, f"No declarations with siren {siren} for any year")
    response.json = declarations

@app.route("/public/declaration/{siren:digit}/{year:digit}", methods=["GET"])
async def get_declaration(request, response, siren, year):
    try:
        record = await db.declaration.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No declaration with siren {siren} and year {year}")
    resource: models.Data = record.as_resource()
    if record.data.path("déclaration.brouillon"):
        pass
    response.json = db.declaration.public_data(resource["data"])


@app.route("/declaration/{siren:digit}/{year:digit}", methods=["GET"])
@tokens.require
@ensure_owner
async def get_declaration(request, response, siren, year):
    try:
        record = await db.declaration.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No declaration with siren {siren} and year {year}")
    resource = record.as_resource()
    if record.data.path("déclarant.nom"):
        await helpers.patch_from_recherche_entreprises(resource["data"])
    response.json = resource


@app.route("/declaration/{siren:digit}/{year:digit}", methods=["DELETE"])
@tokens.require
@ensure_owner
async def delete_declaration(request, response, siren, year):
    if not request["staff"]:
        raise HttpError(403, "Vous n'avez pas l'autorisation")
    await db.declaration.delete(siren, year)
    response.status = 204


@app.route("/declaration/{siren:digit}/{year:digit}/receipt", methods=["POST"])
@tokens.require
@ensure_owner
async def resend_receipt(request, response, siren, year):
    try:
        record = await db.declaration.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No declaration with siren {siren} and year {year}")
    owners = await db.ownership.emails(siren)
    if not owners:  # Staff member
        owners = request["email"]
    data = record.data
    url = request.domain + data.uri
    emails.success.send(owners, url=url, **data)
    response.status = 204


@app.route("/declaration/{siren:digit}/{year:digit}/objectifs-receipt", methods=["POST"])
@tokens.require
@ensure_owner
async def resend_objectifs_receipt(request, response, siren, year):
    try:
        record = await db.declaration.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No declaration with siren {siren} and year {year}")
    owners = await db.ownership.emails(siren)
    if not owners:  # Staff member
        owners = request["email"]
    data = record.data
    emails.objectives.send(owners, **data)
    response.status = 204


@app.route("/representation-equilibree/{siren:digit}/{year:digit}/receipt", methods=["POST"])
@tokens.require
@ensure_owner
async def resend_representation_receipt(request, response, siren, year):
    try:
        record = await db.representation_equilibree.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No représentation équilibrée with siren {siren} and year {year}")
    owners = await db.ownership.emails(siren)
    if not owners:  # Staff member
        owners = request["email"]
    data = record.data
    url = request.domain + data.uri
    emails.representation.send(owners, url=url, **data)
    response.status = 204


@app.route("/representation-equilibree/{siren:digit}/{year:digit}/pdf", methods=["GET"])
async def send_representation_pdf(request, response, siren, year):
    try:
        record = await db.representation_equilibree.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No représentation équilibrée with siren {siren} and year {year}")
    data = record.data
    pdffile = pdf.representation.main(data)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f"attachment; filename={pdf[1]}"
    response.body = bytes(pdffile[0].output())
    return response

@app.route("/declaration/{siren:digit}/{year:digit}/pdf", methods=["GET"])
async def get_declaration_pdf(request, response, siren, year):
    try:
        record = await db.declaration.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No représentation équilibrée with siren {siren} and year {year}")
    data = record.data
    pdffile = pdf.declaration.main(data)
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = f"attachment; filename={pdf[1]}"
    response.body = bytes(pdffile[0].output())
    return response


@app.route("/ownership/{siren:digit}", methods=["GET"])
@tokens.require
@ensure_owner
async def get_owners(request, response, siren):
    response.json = {"owners": await db.ownership.emails(siren)}


@app.route("/ownership/{siren:digit}/{email}", methods=["PUT"])
@tokens.require
@ensure_owner
async def put_owner(request, response, siren, email):
    if "is_owner" not in request and not request["staff"]:
        raise HttpError(403, "Vous n'avez pas les droits nécessaires")
    await db.ownership.put(siren, email)
    response.status = 204


@app.route("/ownership/{siren:digit}/{email}", methods=["DELETE"])
@tokens.require
@ensure_owner
async def delete_owner(request, response, siren, email):
    owners = await db.ownership.emails(siren)
    if len(owners) == 1:
        raise HttpError(403, "Impossible de supprimer le dernier propriétaire.")
    await db.ownership.delete(siren, email)
    response.status = 204


@app.route("/me", methods=["GET"])
@tokens.require
async def me(request, response):
    response.json = {
        "email": request["email"],
        "déclarations": await db.declaration.owned(request["email"]),
        "ownership": await db.ownership.sirens(request["email"]),
        "staff": request["staff"],
    }


@app.route("/simulation", methods=["POST"])
async def start_simulation(request, response):
    data = request.json
    email = data.get("informationsDeclarant", {}).get("email")
    uid = await db.simulation.create(request.json)
    response.json = {"id": uid}
    if email:
        emails.permalink.send(email, id=uid)
    response.status = 200


# KILL THIS ENDPOINT
@app.route("/simulation/{uuid}/send-code", methods=["POST"])
async def send_simulation_code(request, response, uuid):
    # Make sure given simulation exists
    await db.simulation.get(uuid)
    email = request.json.get("email", {})
    response.status = 204
    if not email:
        raise HttpError(400, "Missing `email` key")
    emails.permalink.send(email, id=uuid)


@app.route("/simulation/{uuid}")
class SimulationResource:
    async def on_put(self, request, response, uuid):
        data = request.json
        if not isinstance(data, dict):
            raise HttpError(400, "JSON invalide")
        await db.simulation.put(uuid, data)
        record = await db.simulation.get(uuid)
        response.json = record.as_resource()
        response.status = 200
        draft = data.get("declaration", {}).get("formValidated") != "Valid"
        email = data.get("informationsDeclarant", {}).get("email")
        if email and not draft:
            token = tokens.create(email)
            response.cookies.set(name="api-key", value=token)

    async def on_get(self, request, response, uuid):
        record = await db.simulation.get(uuid)
        try:
            response.json = record.as_resource()
        except db.NoData:
            raise HttpError(404, f"No simulation found with uuid {uuid}")
        response.status = 200


@app.route("/token", methods=["POST"])
async def send_token(request, response):
    # TODO mailbomb management in nginx
    email = request.json.get("email")
    if not email:
        raise HttpError(400, "Missing email key")
    loggers.logger.info(f"Token request FOR {email} FROM {request.ip}")
    token = tokens.create(email)
    if request.ip in config.ALLOWED_IPS:
        response.json = {"token": token}
    else:
        url = request.json.get("url", f"{request.domain}/index-egapro/declaration/?token=")
        link = f"{url}{token}"
        if "localhost" in link or "127.0.0.1" in link:
            print(link)
            loggers.logger.info(link)
        body = emails.ACCESS_GRANTED.format(link=link)
        emails.send(email, "Validation de l'email", body)
        response.status = 204


@app.route("/token", methods=["GET"])
@tokens.require
async def get_token(request, response):
    if not request["staff"]:
        raise HttpError(403, "Vous n'avez pas l'autorisation")
    email = request.query.get("email")
    if not email:
        raise HttpError(400, "Missing email query string")
    token = tokens.create(email)
    response.json = {"token": token}

@app.route("/representation-equilibree/search", methods=["GET"])
async def search_representation_equilibree(request: Request, response: Response):
    q = request.query.get("q", "").strip()
    limit = request.query.int("limit", 10)
    offset = request.query.int("offset", 0)
    section_naf = request.query.get("section_naf", None)
    departement = request.query.get("departement", None)
    region = request.query.get("region", None)
    results = await db.search_representation_equilibree.run(
        query=q,
        limit=limit,
        offset=offset,
        section_naf=section_naf,
        departement=departement,
        region=region,
    )
    response.json = {
        "data": results,
        "count": await db.search_representation_equilibree.count(
            query=q, section_naf=section_naf, departement=departement, region=region
        ),
    }

@app.route("/representation-equilibree/{siren:digit}/{year:digit}", methods=["GET"])
@tokens.require
@add_error(403, constants.ERROR_ENSURE_OWNER)
@ensure_owner
async def get_representation(request, response, siren, year):
    try:
        record = await db.representation_equilibree.get(siren, year)
    except db.NoData:
        raise HttpError(404, f"No représentation équilibrée with siren {siren} and year {year}")
    resource = record.as_resource()
    if record.data.path("déclarant.nom"):
        await helpers.patch_from_recherche_entreprises(resource["data"])
    response.json = resource

@app.route("/representation-equilibree/{siren:digit}/{year:digit}", methods=["PUT"])
@tokens.require
@ensure_owner
async def put_representation(request, response, siren, year):
    try:
        year = int(year)
    except ValueError:
        raise HttpError(422, f"Ce n'est pas une année valide: `{year}`")
    if not siren_is_valid(siren):
        raise HttpError(422, f"Numéro SIREN invalide: {siren}")
    if year not in constants.YEARS:
        years = ", ".join([str(y) for y in constants.YEARS])
        raise HttpError(
            422, f"Il est possible de déclarer seulement pour les années {years}"
        )
    data = request.data
    declarant = request["email"]
    data.setdefault("déclarant", {})
    # Use token email as default for declarant email.
    if not data["déclarant"].get("email"):
        data["déclarant"]["email"] = declarant
    schema.validate(data.raw)
    schema.cross_validate(data.raw, rep_eq=True)
    try:
        current = await db.representation_equilibree.get(siren, year)
    except db.NoData:
        current = None
    else:
        # Do not force new declarant, in case this is a staff person editing
        declared_at = current["declared_at"]
        expired = declared_at and declared_at < utils.remove_one_year(utils.utcnow())
        if expired and not request["staff"]:
            raise HttpError(403, "Le délai de modification est écoulé.")
    await db.representation_equilibree.put(siren, year, data)
    response.status = 204
    if not request["staff"]:
        await db.ownership.put(siren, request["email"])
        loggers.logger.info(f"{siren}/{year} BY {declarant} FROM {request.ip}")
        owners = await db.ownership.emails(siren)
        if not owners:  # Staff member
            owners = request["email"]
        url = request.domain + data.uri
        emails.representation.send(owners, url=url, **data)

@app.route("/search")
async def search(request, response):
    q = request.query.get("q", "").strip()
    limit = request.query.int("limit", 10)
    offset = request.query.int("offset", 0)
    section_naf = request.query.get("section_naf", None)
    departement = request.query.get("departement", None)
    region = request.query.get("region", None)
    results = await db.search.run(
        query=q,
        limit=limit,
        offset=offset,
        section_naf=section_naf,
        departement=departement,
        region=region,
    )
    response.json = {
        "data": results,
        "count": await db.search.count(
            query=q, section_naf=section_naf, departement=departement, region=region
        ),
    }


@app.route("/stats")
async def stats(request, response):
    section_naf = request.query.get("section_naf", None)
    departement = request.query.get("departement", None)
    region = request.query.get("region", None)
    year = request.query.int("year", constants.PUBLIC_YEARS[-1])
    stats = await db.search.stats(
        year,
        section_naf=section_naf,
        departement=departement,
        region=region,
    )
    response.json = dict(stats)


@app.route("/config")
async def get_config(request, response):
    keys = request.query.list("key", [])
    data = {
        "YEARS": constants.YEARS,
        "PUBLIC_YEARS": constants.PUBLIC_YEARS,
        "EFFECTIFS": constants.EFFECTIFS,
        "DEPARTEMENTS": constants.DEPARTEMENTS,
        "REGIONS": constants.REGIONS,
        "REGIONS_TO_DEPARTEMENTS": constants.REGIONS_TO_DEPARTEMENTS,
        "NAF": dict(NAF.pairs()),
        "SECTIONS_NAF": NAF.section,
        "READONLY": config.READONLY,
    }
    response.json = {k: v for k, v in data.items() if not keys or k in keys}


@app.route("/jsonschema.json")
async def get_jsonschema(request, response):
    response.json = schema.SCHEMA.raw


@app.route("/validate-siren")
async def validate_siren(request, response):
    siren = request.query.get("siren")
    year = request.query.get("year", default=constants.INVALID_YEAR)

    try:
        year = int(year)
    except ValueError:
        raise HttpError(422, f"Ce n'est pas une année valide: `{year}`")

    if not siren_is_valid(siren):
        raise HttpError(422, f"Numéro SIREN invalide: {siren}")
    try:
        metadata = await helpers.get_entreprise_details(siren, year)
    except ValueError as err:
        raise HttpError(404, str(err))
    response.json = metadata


@app.route("/entreprise/{siren:digit}")
async def get_entreprise_data(request, response, siren):
    record = await db.declaration.get_last(siren)
    data = db.declaration.public_entreprise_data(record.data)
    response.json = data["entreprise"]


@app.listen("startup")
async def on_startup():
    await init()


@app.listen("shutdown")
async def on_shutdown():
    await db.terminate()


async def init():
    config.init()
    loggers.init()
    try:
        await db.init()
    except RuntimeError as err:
        sys.exit(err)
