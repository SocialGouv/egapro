from naf import DB as NAF

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
    def siren(self):
        return self.path("entreprise.siren")

    @property
    def email(self):
        return self.path("déclarant.email")

    @property
    def naf(self):
        code = self.path("entreprise.code_naf")
        if not code:
            return None
        return f"{code} - {NAF[code]}"

    @property
    def company(self):
        return self.path("entreprise.raison_sociale")

    @property
    def region(self):
        return self.path("entreprise.région")

    @property
    def departement(self):
        return self.path("entreprise.département")

    @property
    def structure(self):
        return (
            "Unité Economique et Sociale (UES)"
            if self.path("entreprise.ues.entreprises")
            else "Entreprise"
        )

    @property
    def ues(self):
        return self.path("entreprise.ues.raison_sociale")

    @property
    def grade(self):
        return self.path("déclaration.index")

    @property
    def uri(self):
        if self.get("source") == "simulateur":
            return f"/simulateur/{self.id}"
        return f"/declaration/?siren={self.siren}&year={self.year}"

    def path(self, path):
        data = self
        for sub in path.split("."):
            data = data.get(sub, {})
        return data if data or data in [False, 0] else None
