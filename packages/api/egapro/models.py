from typing import Literal, Union
from naf import DB as NAF

from egapro.utils import delete_keypath

from . import constants


class Data(dict):
    def __init__(self, data=None):
        if isinstance(data, Data):
            data = data.raw
        super().__init__(data or [])

    # Emulate **kwargs.
    def __getitem__(self, key):
        try:
            return getattr(self, key)
        except AttributeError:
            return super().__getitem__(key)

    def keys(self):
        keys = set(super().keys())
        # Extend with custom properties.
        keys = keys | (set(dir(self)) - set(dir(dict)))
        return {k for k in keys if not k.startswith("_")}

    def __iter__(self):
        yield from self.keys()
        # End emulate **kwargs.

    @property
    def raw(self):
        # Access raw data only (without the custom properties)
        return dict(self.items())

    @property
    def id(self):
        return self.get("id")

    @property
    def validated(self):
        return not self.is_draft()

    def is_draft(self):
        return self.path("déclaration.brouillon")

    def is_public(self):
        return self.year in constants.PUBLIC_YEARS

    @property
    def year(self):
        try:
            return self["déclaration"]["année_indicateurs"]
        except KeyError:
            try:
                # OLD data.
                return int(self["déclaration"]["fin_période_référence"][-4:])
            except (KeyError, IndexError):
                return None

    @property
    def siren(self) -> str:
        return self.path("entreprise.siren")

    @property
    def email(self) -> str:
        return self.path("déclarant.email")

    @property
    def naf(self):
        code = self.path("entreprise.code_naf")
        if not code or code not in NAF:
            return code
        return f"{code} - {NAF[code]}"

    @property
    def company(self) -> str:
        return self.path("entreprise.raison_sociale")

    @property
    def region(self):
        return self.path("entreprise.région")

    @property
    def departement(self):
        return self.path("entreprise.département")

    @property
    def structure(self) -> str:
        return (
            "Unité Economique et Sociale (UES)"
            if self.path("entreprise.ues.entreprises")
            else "Entreprise"
        )

    @property
    def ues(self) -> str:
        return self.path("entreprise.ues.nom")

    @property
    def grade(self):
        return self.path("déclaration.index")

    @property
    def uri(self):
        # URIs for: simulateur | representation | declaration
        if self.get("source") == "simulateur":
            return f"/index-egapro/simulateur/{self.id}"
        elif self.get("indicateurs"):
            if "représentation_équilibrée" in self.get("indicateurs"):
                return f"/representation-equilibree/commencer"
        return f"/index-egapro/declaration/?siren={self.siren}&year={self.year}"

    def path(self, path):
        data = self
        for sub in path.split("."):
            data = data.get(sub, {})
        return data if data or data in [False, 0] else None

    def delete_path(self, path: str):
        delete_keypath(self, path)
