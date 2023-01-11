import sys
from collections import Counter, namedtuple
from dataclasses import dataclass
from datetime import date
from pathlib import Path

import fastjsonschema
import ujson as json
from stdnum.fr.siren import is_valid as siren_is_valid

from egapro.utils import import_by_path
from egapro.models import Data

SCHEMA = None
JSON_SCHEMA = None


def init():
    path = Path(__file__).parent / "raw.yml"
    schema = Schema(path.read_text())
    globals()["SCHEMA"] = schema
    try:
        globals()["JSON_SCHEMA"] = fastjsonschema.compile(schema.raw)
    except ValueError as err:
        print(json.dumps(schema))
        sys.exit(err)


def validate(data):
    try:
        JSON_SCHEMA(data)
    except fastjsonschema.JsonSchemaException as err:
        raise ValueError(err)


def cross_validate(data, rep_eq=False):
    if not rep_eq:
        try:
            _cross_validate(data)
        except AssertionError as err:
            raise ValueError(err)
    else:
        try:
            _repeq_cross_validate(data)
        except AssertionError as err:
            raise ValueError(err)

def _repeq_cross_validate(data):
    data = Data(data)

    required = [
        "entreprise.code_naf",
        "déclarant.prénom",
        "déclarant.nom",
        "déclarant.téléphone",
    ]

    for path in required:
        assert data.path(path), f"Le champ {path} doit être défini"

    percentages = [
        ("indicateurs.représentation_équilibrée.pourcentage_femmes_cadres", "indicateurs.représentation_équilibrée.pourcentage_hommes_cadres"),
        ("indicateurs.représentation_équilibrée.pourcentage_femmes_membres", "indicateurs.représentation_équilibrée.pourcentage_hommes_membres")
    ]

    for pair in percentages:
        x,y = pair[0], pair[1]
        condition1 = data.path(x) is not None and data.path(y) is None
        condition2 = data.path(y) is not None and data.path(x) is None
        assert not condition1, f"Les paires de pourcentages doivent être respectées."
        assert not condition2, f"Les paires de pourcentages doivent être respectées."

    pct_eq_100 = all(not(data.path(x) and data.path(y)) or data.path(x) + data.path(y) == 100 for (x,y) in percentages)
    assert pct_eq_100, f"Les pourcentages doivent additionner à 100"

def _cross_validate(data):
    data = Data(data)
    if data.validated:
        # Those keys are only required if the data is validated
        required = [
            "entreprise.code_naf",
            "déclarant.prénom",
            "déclarant.nom",
            "déclarant.téléphone",
        ]
        for path in required:
            # rule 1
            assert data.path(path), f"Le champ {path} doit être défini"
        index = data.path("déclaration.index")
        periode_suffisante = data.path("déclaration.période_suffisante")
        if periode_suffisante is False:
            msg = "La période de référence ne permet pas de définir des indicateurs"
            # rule 2
            assert "indicateurs" not in data, msg
        else:
            mesures_correctives = data.path("déclaration.mesures_correctives")
            modalites_obj_mesures = data.path(
                "déclaration.publication.modalités_objectifs_mesures"
            )
            date_pub_mesures = data.path(
                "déclaration.publication.date_publication_mesures"
            )
            date_pub_objectifs = data.path(
                "déclaration.publication.date_publication_objectifs"
            )
            periode_reference = data.path("déclaration.fin_période_référence")

            if data.year < 2021 or index is None or index >= 85:
                remunerations = data.path(
                    "indicateurs.rémunérations.objectif_de_progression"
                )
                augmentations = data.path(
                    "indicateurs.augmentations.objectif_de_progression"
                )
                promotions = data.path("indicateurs.promotions.objectif_de_progression")
                aug_et_promo = data.path(
                    "indicateurs.augmentations_et_promotions.objectif_de_progression"
                )
                conges_mat = data.path(
                    "indicateurs.congés_maternité.objectif_de_progression"
                )
                hautes_rem = data.path(
                    "indicateurs.hautes_rémunérations.objectif_de_progression"
                )
                indicators = [
                    remunerations,
                    augmentations,
                    promotions,
                    aug_et_promo,
                    conges_mat,
                    hautes_rem,
                    date_pub_mesures,
                    date_pub_objectifs,
                    modalites_obj_mesures,
                ]

                msg = "Les objectifs pour ce champ ne doivent pas être définis si l'année de déclaration précède 2021 et si l'index est supérieur ou égal à 85."

                for indicator in indicators:
                    # rule 3
                    assert not indicator, msg

            if data.year >= 2021:
                if index is not None:
                    if index >= 85:
                        msg = "Les modalités des objectifs et mesures ne doivent pas être définies si l'index est supérieur à 85."
                        # rule 4
                        assert not modalites_obj_mesures, msg
                if date_pub_mesures is not None:
                    msg = "La date de publication des mesures doit être postérieure à la fin de la période de référence."
                    # rule 5
                    assert date_pub_mesures > periode_reference, msg
                if date_pub_objectifs is not None:
                    msg = "La date de publication des objectifs doit être postérieure à la fin de la période de référence."
                    # rule 6
                    assert date_pub_objectifs > periode_reference, msg

            if data.year >= 2020 or index is not None:
                msg = "La date de publication doit être définie"
                # rule 7.a
                assert data.path("déclaration.publication.date"), msg
                msg = (
                    "Les modalités de publication ou le site Internet doit être défini"
                )
                # rule 7.b
                assert data.path("déclaration.publication.modalités") or data.path(
                    "déclaration.publication.url"
                ), msg
            if index is None:
                msg = "Les mesures correctives ne doivent pas être définies si l'index n'est pas calculable"
                # rule 8
                assert not mesures_correctives, msg
            elif index >= 75:
                msg = "Les mesures correctives ne doivent pas être définies pour un index de 75 ou plus"
                # rule 9
                assert not mesures_correctives, msg
            else:
                msg = "Les mesures correctives doivent être définies pour un index inférieur à 75"
                # rule 10
                assert mesures_correctives, msg
            periode_reference = data.path("déclaration.fin_période_référence")
            # rule 11.a
            assert (
                periode_reference
            ), "Le champ déclaration.fin_période_référence doit être défini"
            try:
                annee_periode_reference = date.fromisoformat(periode_reference).year
            except ValueError:
                annee_periode_reference = None
            # rule 11.b
            assert (
                annee_periode_reference == data.year
            ), "L'année de la date de fin de période ne peut pas être différente de l'année au titre de laquelle les indicateurs sont calculés."

            tranche = data.path("entreprise.effectif.tranche")
            indicateurs_gt_250 = ("indicateurs.promotions", "indicateurs.augmentations")
            indicateurs_lt_250 = "indicateurs.augmentations_et_promotions"
            if tranche == "50:250":
                for path in indicateurs_gt_250:
                    msg = f"L'indicateur {path} ne doit pas être défini pour la tranche 50 à 250"
                    # rule 12.a
                    assert not data.path(path), msg
                msg = f"L'indicateur {indicateurs_lt_250} doit être défini pour la tranche 50 à 250"

                # rule 12.b
                assert data.path(indicateurs_lt_250), msg
            else:
                msg = f"L'indicateur {indicateurs_lt_250} ne peut être défini que pour la tranche 50 à 250"
                # rule 13.a
                assert not data.path(indicateurs_lt_250), msg
                for path in indicateurs_gt_250:
                    msg = f"L'indicateur {path} doit être défini"
                    # rule 13.b
                    assert data.path(path), msg

            if data.year >= 2021:
                msg = "data.entreprise.plan_relance doit être défini"
                # rule 14
                assert data.path("entreprise.plan_relance") is not None, msg

    for key in SCHEMA.indicateurs_keys:
        path = f"indicateurs.{key}"
        if data.path(f"{path}.non_calculable"):
            msg = f"L'indicateur {path} doit être vide s'il n'est pas calculable"
            # rule 15
            assert list(data.path(path).keys()) == ["non_calculable"], msg
        elif data.path(path) is not None:
            resultat = data.path(f"{path}.résultat")
            # rule 16
            msg = f"{path}.résultat doit être défini si l'indicateur est calculable"
            if key != "rémunérations" or data.path(f"{path}.population_favorable"):
                # The "rémunérations" indicator is sent through several steps
                # on the "formulaire" frontend. The only way the "formulaire"
                # sent all its data is if there's a `population_favorable`
                # field. However, this latter field is only provided if the
                # `résultat` is not `0`.
                # rule 17
                assert resultat is not None, msg

    keys = ["rémunérations", "augmentations", "promotions"]
    for key in keys:
        path = f"indicateurs.{key}"
        if data.path(f"{path}.résultat") == 0:
            msg = f"{path}.population_favorable doit être vide si le résultat est 0"
            # rule 17
            assert not data.path(f"{path}.population_favorable"), msg

    # Entreprise
    entreprises = data.path("entreprise.ues.entreprises") or []
    all_siren = [e["siren"] for e in entreprises]
    duplicates = [v for v, c in Counter(all_siren).items() if c > 1]
    # rule 18.a
    assert not duplicates, f"Valeur de siren en double: {','.join(duplicates)}"
    # rule 18.b
    assert (
        data.siren not in all_siren
    ), "L'entreprise déclarante ne doit pas être dupliquée dans les entreprises de l'UES"
    for ues in entreprises:
        msg = f"Invalid siren: {ues['siren']}"
        # rule 18.c
        assert siren_is_valid(ues["siren"]), msg
    if not entreprises:
        msg = "Une entreprise ne doit pas avoir de nom d'UES"
        # rule 19
        assert not data.path("entreprise.ues.nom"), msg

    # Rémunérations
    base = "indicateurs.rémunérations"
    if not data.path(f"{base}.non_calculable"):
        date_consultation_cse = data.path(f"{base}.date_consultation_cse")
        mode = data.path(f"{base}.mode")
        if mode == "csp":
            msg = f"{base}.date_consultation_cse ne doit pas être défini si indicateurs.rémunérations.mode vaut 'csp'"
            # rule 20
            assert not date_consultation_cse, msg

    # Augmentations et promotions
    base = "indicateurs.augmentations_et_promotions"
    if (
        data.path(f"{base}.résultat") == 0
        and data.path(f"{base}.résultat_nombre_salariés") == 0
    ):
        path = f"{base}.population_favorable"
        msg = f"{path} ne doit pas être défini si résultat=0 et résultat_nombre_salariés=0"
        # rule 21
        assert not data.path(path), msg

    # Hautes rémunérations
    base = "indicateurs.hautes_rémunérations"
    if data.path(f"{base}.résultat") == 5:
        msg = f"{base}.population_favorable ne doit pas être défini si résultat vaut 5"
        # rule 22
        assert not data.path(f"{base}.population_favorable"), msg


def extrapolate(definition: str):
    # TODO: arbitrate between ?key: value and key: ?value
    if definition.startswith("?"):
        return {"oneOf": [{"type": "null"}, extrapolate(definition[1:])]}
    if definition in ("date", "time", "date-time", "uri", "email"):
        return {"type": "string", "format": definition}
    if definition in ("integer", "string", "boolean", "number"):
        return {"type": definition}
    if definition.startswith('r"') and definition.endswith('"'):
        return {"type": "string", "pattern": definition[2:-1]}
    if definition.startswith("python:"):
        path = definition[7:]
        definition = import_by_path(path)
        if callable(definition):
            definition = definition()
        return definition
    if definition.count(":") == 1:
        type_ = float if "." in definition else int
        out = {"type": "number" if type_ is float else "integer"}
        min_ = max_ = None
        minmax = [el for el in definition.split(":") if el != ""]
        if len(minmax) == 2:
            min_, max_ = minmax
        elif definition.startswith(":"):
            max_ = minmax[0]
        else:
            min_ = minmax[0]
        if min_ is not None:
            out["minimum"] = type_(min_)
        if max_ is not None:
            out["maximum"] = type_(max_)
        return out
    if "|" in definition:
        enum = [value for value in definition.split("|") if value]
        return {"type": "string", "enum": enum}
    if definition.startswith("[") and definition.endswith("]"):
        values = definition[1:-1].split(",")
        if len(values) > 1:
            items = [extrapolate(v.strip()) for v in values]
        else:
            items = extrapolate(values[0])
        return {"type": "array", "items": items}
    raise ValueError(f"Unknown type {definition!r}")


def count_indent(s):
    for i, c in enumerate(s):
        if c != " ":
            return i
    return len(s)


class ParsingError(Exception):
    def __init__(self, msg, line):
        super().__init__(f"{line.index}: {msg} in `{line.key}`")


Line = namedtuple("Line", ["index", "indent", "key", "value", "kind", "description"])


@dataclass
class Node:
    index: int
    indent: int
    key: str = None
    definition: str = None
    description: str = None
    required: bool = False
    kind: str = None
    strict: bool = True
    nullable: bool = False
    readonly: bool = False

    def __bool__(self):
        return bool(self.key or self.definition)


class Property:
    def __init__(self, line):
        self.line = line


class StopRecursivity(Exception):
    def __init__(self, indent):
        self.indent = indent


class Object(dict):
    def __init__(self, node=None):
        kwargs = {
            "type": "object",
            "properties": {},
            "additionalProperties": node and not node.strict or False,
        }
        super().__init__(**kwargs)

    def add(self, node, definition=None):
        if definition is None:
            definition = extrapolate(node.definition)
        if node.description:
            definition["description"] = node.description
        if node.nullable:
            definition = {"anyOf": [{"type": "null"}, definition]}
        if node.readonly:
            definition["readOnly"] = True
        self["properties"][node.key] = definition
        if node.required:
            self.required(node.key)

    def required(self, key):
        if "required" not in self:
            self["required"] = []
        self["required"].append(key)


class Array(dict):
    def __init__(self, node):
        kwargs = {
            "type": "array",
            "items": {},
        }
        super().__init__(**kwargs)

    def add(self, node, definition=None):
        if node.key:
            if not self["items"]:
                self["items"] = Object()
            self["items"].add(node, definition)
        else:
            self["items"] = extrapolate(node.definition)
            if node.description:
                self["items"]["description"] = node.description


class Schema:
    def __init__(self, raw):
        self.raw = json.loads(json.dumps(self.load(raw.splitlines())))

    def __getattr__(self, attr):
        return getattr(self.raw, attr)

    def __getitem__(self, item):
        return self.raw.__getitem__(item)

    @staticmethod
    def iter_lines(iterable):
        previous = Node(0, 0)
        current = None
        for index, raw in enumerate(iterable):
            indent = count_indent(raw)
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            node = Node(index, indent)
            if line.startswith("- "):
                line = line[2:]
                node.kind = "array"
                node.indent += 2
            if ": " in line or line.endswith(":"):
                if line.endswith(":"):
                    key = line[:-1]
                    definition = ""
                else:
                    key, definition = line.split(": ", maxsplit=1)
                if key.startswith("+"):
                    key = key[1:]
                    node.required = True
                if key.startswith("?"):
                    key = key[1:]
                    node.nullable = True
                if key.startswith("="):
                    key = key[1:]
                    node.readonly = True
                if key.startswith("~"):
                    key = key[1:]
                    node.strict = False
                if key.startswith('"') and key.endswith('"'):
                    key = key[1:-1]
                node.key = key.lower()
            else:
                definition = line
            description = None
            if "#" in definition:
                definition, description = definition.split("#")
                node.description = description.strip()
            definition = definition.strip()
            if definition.startswith('"') and definition.endswith('"'):
                definition = definition[1:-1]
            node.definition = definition
            next_ = node
            if current:
                yield (previous, current, next_)
                previous = current
            current = next_
        yield (previous, current, Node(0, 0))

    @classmethod
    def load(cls, lines, parent=None):
        if parent is None:
            parent = Object()
            lines = cls.iter_lines(lines)
        for (prev, curr, next_) in lines:
            if curr.indent % 2 != 0:
                raise ParsingError("Wrong indentation", curr)
            if curr.indent != prev.indent and parent is None:
                raise ParsingError("Wrong indentation", curr)
            if curr.definition:
                parent.add(curr)
            if next_.indent < curr.indent:
                raise StopRecursivity(indent=next_.indent)
                # Move back one step up in recursivity.
            elif next_.indent > curr.indent:  # One more indent
                # Are we an array or an object ?
                if next_.kind == "array":
                    children = Array(curr)
                else:
                    children = Object(curr)
                if curr.key:
                    parent.add(curr, children)
                try:
                    Schema.load(lines, children)
                except StopRecursivity as err:
                    if err.indent < curr.indent:
                        raise
                    continue  # We are on the right level.
        return parent

    @property
    def sub_keys(self):
        keys = list(self["properties"].keys())
        keys.remove("indicateurs")
        keys += [f"indicateurs.{k}" for k in self.indicateurs_keys]
        return keys

    @property
    def indicateurs_keys(self):
        return list(self["properties"]["indicateurs"]["properties"].keys())


init()
