from egapro import constants
from egapro.models import Data

from .base import PDF, as_date


class Receipt(PDF):

    LABELS = {
        "aucun_cadre_dirigeant": "Aucun cadre dirigeant",
        "un_seul_cadre_dirigeant": "Un seul cadre dirigeant",
        "aucune_instance_dirigeante": "Aucune instance dirigeante",
    }

    def __init__(self, data, *args, **kwargs):
        self.data = data
        super().__init__(*args, **kwargs)
        self.set_title(f"Index Egapro {data.siren}/{data.year}")

    @property
    def heading(self):
        return (
            "Récapitulatif de la déclaration des écarts éventuels de représentation femmes-hommes dans les postes de direction "
            f"pour l'année {self.data.year + 1} au titre des données {self.data.year}"
        )

    def footer(self):
        # Position at 1.5 cm from bottom
        anchor = -16
        modified_at = as_date(self.data.get("modified_at"))
        at = as_date(self.data.path("déclaration.date"))
        if modified_at and modified_at != at:
            anchor = -20
        self.set_y(anchor)
        # Marianne italic 8
        self.set_font("Marianne", "I", 8)
        txt = (
            f"Déclaration du {at} pour le Siren "
            f"{self.data.siren} et l'année {self.data.year}"
        )
        self.cell(0, 10, txt, 0, 0, "C")
        self.ln(4)
        if modified_at and modified_at != at:
            self.cell(0, 10, f"Dernière modification: {modified_at}", 0, 0, "C")
            self.ln(4)
        page_number = self.page_no()
        self.cell(0, 10, f"Page {page_number}/{{nb}}", 0, 0, "C")


def main(data):
    data = Data(data)
    pdf = Receipt(data)

    cells = (
        ("Nom Prénom", "{nom} {prénom}".format(**data["déclarant"])),
        ("Adresse mail", data.path("déclarant.email")),
    )
    pdf.write_table("Informations déclarant", cells)

    adresse = [data["entreprise"].get(k) for k in ("adresse", "code_postal", "commune")]
    adresse = " ".join(v for v in adresse if v)
    cells = [
        ("Raison sociale", data.company),
        ("Siren", data.siren),
        ("Code NAF", data.naf),
        ("Adresse", adresse),
    ]
    pdf.write_table(
        "Informations entreprise", cells
    )
    cells = (
        ("Année au titre de laquelle les écarts sont calculés", data.year),
        (
            "Date de fin de la période de douze mois consécutifs correspondant à l'exercice comptable pour le calcul des écarts",
            as_date(data.path("déclaration.fin_période_référence")),
        ),
    )
    pdf.write_table("Période de référence", cells)

    non_calculable = data.path("indicateurs.représentation_équilibrée.motif_non_calculabilité_cadres")
    if non_calculable:
        cells = [("Motif de non calculabilité", non_calculable)]
    else:
        cells = (
            ("Pourcentage de femmes parmi les cadres dirigeants", f"{data.path('indicateurs.représentation_équilibrée.pourcentage_femmes_cadres')} %"),
            ("Pourcentage d'hommes parmi les cadres dirigeants", f"{data.path('indicateurs.représentation_équilibrée.pourcentage_hommes_cadres')} %"),
        )
    pdf.write_table("Ecart de représentation parmi les cadres dirigeants", cells)

    non_calculable = data.path("indicateurs.représentation_équilibrée.motif_non_calculabilité_membres")
    if non_calculable:
        cells = [("Motif de non calculabilité", non_calculable)]
    else:
        cells = (
            ("Pourcentage de femmes parmi les membres des instances dirigeantes", f"{data.path('indicateurs.représentation_équilibrée.pourcentage_femmes_membres')} %"),
            ("Pourcentage d'hommes parmi les membres des instances dirigeantes", f"{data.path('indicateurs.représentation_équilibrée.pourcentage_hommes_membres')} %"),
        )
    pdf.write_table("Ecart de représentation parmi les membres des instances dirigeantes", cells)

    publication_url = data.path("déclaration.publication.url")
    cells = (
        ("Date de publication", as_date(data.path("déclaration.publication.date"))),
        ("Site Internet de publication", publication_url) if publication_url else
        (
            "Modalités de communication auprès des salariés",
            data.path("déclaration.publication.modalités"),
        ),
    )
    pdf.write_table("Publication", cells)
    return pdf, f"representation_{data.siren}_{data.year + 1}.pdf"
