from egapro import constants
from egapro.models import Data

from .base import PDF, as_date


class Receipt(PDF):

    LABELS = {
        "niveau_branche": "Par niveau ou coefficient hiérarchique en application de la classification de branche",
        "niveau_autre": "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
        "csp": "Par catégorie socio-professionnelle",
        "egvi40pcet": "Effectif des groupes valides inférieur à 40% de l'effectif",
        "absaugi": "Absence d'augmentations individuelles",
        "absprom": "Absence de promotions",
        "etsno5f5h": "L'entreprise ne comporte pas au moins 5 femmes et 5 hommes",
        "absrcm": "Absence de retours de congé maternité",
        "absaugpdtcm": "Absence d'augmentations salariales pendant la durée du ou des congés maternité",
        "me": "mesures envisagées",
        "mne": "mesures non envisagées",
        "mmo": "mesures mises en œuvre",
    }

    def __init__(self, data, *args, **kwargs):
        self.data = data
        super().__init__(*args, **kwargs)
        self.set_title(f"Index Egapro {data.siren}/{data.year}")

    @property
    def heading(self):
        return (
            "Récapitulatif de la déclaration de votre index de l'égalité "
            "professionnelle entre les femmes et les hommes "
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
    tranche_effectif = data.path("entreprise.effectif.tranche")

    cells = (
        ("Nom Prénom", "{nom} {prénom}".format(**data["déclarant"])),
        ("Adresse mail", data.path("déclarant.email")),
    )
    pdf.write_table("Informations déclarant", cells)

    adresse = [data["entreprise"].get(k) for k in ("adresse", "code_postal", "commune")]
    adresse = " ".join(v for v in adresse if v)
    cells = [
        ("Structure", data.structure),
        ("Tranche effectifs", constants.EFFECTIFS.get(tranche_effectif)),
        ("Raison sociale", data.company),
        ("Siren", data.siren),
        ("Code NAF", data.naf),
        ("Adresse", adresse),
    ]
    if data.path("entreprise.ues.entreprises"):
        cells.append(("Nom UES", data.path("entreprise.ues.nom")))
        cells.append(
            (
                "Nombre d'entreprises composant l'UES",
                len(data.path("entreprise.ues.entreprises")) + 1,
            ),
        )
    pdf.write_table(
        "Périmètre retenu pour le calcul et la publication des indicateurs", cells
    )

    effectif = data.path("entreprise.effectif.total")
    cells = (
        ("Année au titre de laquelle les indicateurs sont calculés", data.year),
        (
            "Date de fin de la période de référence",
            as_date(data.path("déclaration.fin_période_référence")),
        ),
        (
            "Nombre de salariés pris en compte pour le calcul des indicateurs",
            int(effectif) if effectif else "-",
        ),
    )
    pdf.write_table("Informations calcul et période de référence", cells)

    non_calculable = data.path("indicateurs.rémunérations.non_calculable")
    if non_calculable:
        cells = [("Motif de non calculabilité", non_calculable)]
    else:
        mode = data.path("indicateurs.rémunérations.mode")
        nb_niveaux = None
        if mode != "csp":
            nb_niveaux = len(data.path("indicateurs.rémunérations.catégories") or [])
        cells = (
            ("Modalité de calcul", mode),
            (
                "Date de consultation du CSE",
                as_date(data.path("indicateurs.rémunérations.date_consultation_cse")),
            ),
            (
                "Nombre de niveaux ou coefficients",
                nb_niveaux or None,
            ),
            (
                "Résultat final en %",
                data.path("indicateurs.rémunérations.résultat"),
            ),
            (
                "Population envers laquelle l'écart est favorable",
                data.path("indicateurs.rémunérations.population_favorable"),
            ),
            (
                "Nombre de points obtenus",
                data.path("indicateurs.rémunérations.note"),
            ),
        )
    pdf.write_table("Indicateur relatif à l'écart de rémunération", cells)

    if tranche_effectif == "50:250":
        non_calculable = data.path(
            "indicateurs.augmentations_et_promotions.non_calculable"
        )
        if non_calculable:
            cells = [("Motif de non calculabilité", non_calculable)]
        else:
            cells = (
                (
                    "Résultat final en %",
                    data.path("indicateurs.augmentations_et_promotions.résultat"),
                ),
                (
                    "Résultat final en nombre équivalent de salariés",
                    data.path(
                        "indicateurs.augmentations_et_promotions.résultat_nombre_salariés"
                    ),
                ),
                (
                    "Population envers laquelle l'écart est favorable",
                    data.path(
                        "indicateurs.augmentations_et_promotions.population_favorable"
                    ),
                ),
                (
                    "Nombre de points obtenus sur le résultat final en pourcentage",
                    data.path(
                        "indicateurs.augmentations_et_promotions.note_en_pourcentage"
                    ),
                ),
                (
                    "Nombre de points obtenus sur le résultat final en nombre de salariés",
                    data.path(
                        "indicateurs.augmentations_et_promotions.note_nombre_salariés"
                    ),
                ),
                (
                    "Nombre de points obtenus",
                    data.path("indicateurs.augmentations_et_promotions.note"),
                ),
            )
        pdf.write_table(
            "Indicateur relatif à l'écart de taux d'augmentations individuelles",
            cells,
        )
    else:
        non_calculable = data.path("indicateurs.augmentations.non_calculable")
        if non_calculable:
            cells = [("Motif de non calculabilité", non_calculable)]
        else:
            cells = (
                (
                    "Résultat final en %",
                    data.path("indicateurs.augmentations.résultat"),
                ),
                (
                    "Population envers laquelle l'écart est favorable",
                    data.path("indicateurs.augmentations.population_favorable"),
                ),
                (
                    "Nombre de points obtenus",
                    data.path("indicateurs.augmentations.note"),
                ),
            )
        pdf.write_table(
            "Indicateur relatif à l'écart de taux d'augmentations individuelles "
            "(hors promotions)",
            cells,
        )

        non_calculable = data.path("indicateurs.promotions.non_calculable")
        if non_calculable:
            cells = [("Motif de non calculabilité", non_calculable)]
        else:
            cells = [
                ("Résultat final en %", data.path("indicateurs.promotions.résultat")),
                (
                    "Population envers laquelle l'écart est favorable",
                    data.path("indicateurs.promotions.population_favorable"),
                ),
                ("Nombre de points obtenus", data.path("indicateurs.promotions.note")),
            ]
        pdf.write_table("Indicateur relatif à l'écart de taux de promotions", cells)

    non_calculable = data.path("indicateurs.congés_maternité.non_calculable")
    if non_calculable:
        cells = [("Motif de non calculabilité", non_calculable)]
    else:
        cells = (
            ("Résultat final en %", data.path("indicateurs.congés_maternité.résultat")),
            (
                "Nombre de points obtenus",
                data.path("indicateurs.congés_maternité.note"),
            ),
        )
    pdf.write_table(
        "Indicateur relatif au % de salariées ayant bénéficié d'une augmentation dans "
        "l'année suivant leur retour de congé maternité",
        cells,
    )

    cells = (
        (
            "Résultat en nombre de salariés du sexe sous-représenté",
            data.path("indicateurs.hautes_rémunérations.résultat"),
        ),
        (
            "Sexe des salariés sur-représentés",
            data.path("indicateurs.hautes_rémunérations.population_favorable"),
        ),
        (
            "Nombre de points obtenus",
            data.path("indicateurs.hautes_rémunérations.note"),
        ),
    )
    pdf.write_table(
        "Indicateur relatif au nombre de salariés du sexe sous-représenté parmi les "
        "10 salariés ayant perçu les plus hautes rémunératons",
        cells,
    )

    cells = (
        ("Total de points obtenus", data.path("déclaration.points")),
        (
            "Nombre de points maximum pouvant être obtenus",
            data.path("déclaration.points_calculables"),
        ),
        (
            "Résultat final sur 100 points",
            data.grade if data.grade is not None else "Non calculable",
        ),
        (
            "Mesures de corrections prévues",
            data.path("déclaration.mesures_correctives"),
        ),
    )
    pdf.write_table("Niveau de résultat global", cells)

    cells = (
        ("Date de publication", as_date(data.path("déclaration.publication.date"))),
        ("Site Internet de publication", data.path("déclaration.publication.url")),
        (
            "Modalités de communication auprès des salariés",
            data.path("déclaration.publication.modalités"),
        ),
    )
    pdf.write_table("Publication du niveau de résultat global", cells)

    index = data.path("déclaration.index")
    date_pub_objectifs = data.path("déclaration.publication.date_publication_objectifs")
    effectif_tranche = data.path("entreprise.effectif.tranche")
    cells_title = "Objectifs de progression"

    indicateur2_cell, indicateur3_cell = (
        ("Objectif Indicateur écart de taux d'augmentations individuelles", ""),
        (
            "",
            data.path("indicateurs.augmentations.objectif_de_progression"),
        ),
    ), (
        ("Objectif Indicateur écart de taux de promotions", ""),
        (
            "",
            data.path("indicateurs.promotions.objectif_de_progression"),
        )
    )

    if effectif_tranche == "50:250":
        indicateur2_cell = ((None, None), (None, None))
        indicateur3_cell = ((None, None), (None, None))

    indicateur2et3_cell = (
        (
            ("Objectif Indicateur écart de taux d'augmentations individuelles", ""),
            (
                "",
                data.path(
                    "indicateurs.augmentations_et_promotions.objectif_de_progression"
                ),
            ),
        )
        if effectif_tranche == "50:250"
        else ((None, None), (None, None))
    )

    if index is not None and date_pub_objectifs is not None:
        if 75 <= index < 85:

            cells = (
                ("Objectif Indicateur écart de rémunération", ""),
                ("", data.path("indicateurs.rémunérations.objectif_de_progression")),
                *indicateur2_cell,
                *indicateur3_cell,
                *indicateur2et3_cell,
                ("Objectif Indicateur retour de congé maternité", ""),
                (
                    "",
                    data.path("indicateurs.congés_maternité.objectif_de_progression"),
                ),
                ("Objectif Indicateur dix plus hautes rémunérations", ""),
                (
                    "",
                    data.path(
                        "indicateurs.hautes_rémunérations.objectif_de_progression"
                    ),
                ),
                ("Date de publication des objectifs", ""),
                (
                    "",
                    as_date(
                        data.path("déclaration.publication.date_publication_objectifs")
                    ),
                ),
                ("Modalités de communication auprès des salariés", ""),
                (
                    "",
                    data.path("déclaration.publication.modalités_objectifs_mesures"),
                ),
            )
        elif index < 75:
            cells_title = "Objectifs de progression et mesures de correction"

            cells = (
                ("Objectif Indicateur écart de rémunération", ""),
                (
                    "",
                    data.path("indicateurs.rémunérations.objectif_de_progression"),
                ),
                *indicateur2_cell,
                *indicateur3_cell,
                *indicateur2et3_cell,
                ("Objectif Indicateur retour de congé maternité", ""),
                (
                    "",
                    data.path("indicateurs.congés_maternité.objectif_de_progression"),
                ),
                ("Objectif Indicateur dix plus hautes rémunérations", ""),
                (
                    "",
                    data.path(
                        "indicateurs.hautes_rémunérations.objectif_de_progression"
                    ),
                ),
                ("Date de publication des objectifs de progression", ""),
                (
                    "",
                    as_date(
                        data.path("déclaration.publication.date_publication_objectifs")
                    ),
                ),
                ("Date de publication des mesures de correction", ""),
                (
                    "",
                    as_date(
                        data.path("déclaration.publication.date_publication_mesures")
                    ),
                ),
                ("Modalités de communication auprès des salariés", ""),
                (
                    "",
                    data.path("déclaration.publication.modalités_objectifs_mesures"),
                ),
            )
        pdf.write_table(cells_title, cells)

    return pdf, f"declaration_{data.siren}_{data.year + 1}.pdf"
