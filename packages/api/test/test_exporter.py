import io
import json
from datetime import date, datetime, timezone
from pathlib import Path

import pytest

from egapro import db, exporter, dgt

pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
async def init_db():
    await db.init()
    yield
    await db.terminate()


async def test_dump():
    await db.declaration.put(
        "12345678",
        2020,
        "foo@bar.com",
        {
            "déclaration": {
                "date": datetime(2020, 10, 24, 10, 11, 12),
            }
        },
    )
    await db.declaration.put(
        "87654321",
        2020,
        "foo@baz.com",
        {
            "déclaration": {
                "date": datetime(2020, 10, 24, 10, 11, 13),
            },
        },
    )
    await db.declaration.put(
        "87654331",
        2020,
        "foo@baz.com",
        {
            "déclaration": {
                "date": datetime(2020, 10, 24, 10, 11, 13),
                "brouillon": True,
            }
        },
    )
    path = Path("/tmp/test_dump_egapro.json")
    await exporter.dump(path)
    data = json.loads(path.read_text())
    for declaration in data:
        assert declaration["déclaration"]["date"]
        del declaration["déclaration"]["date"]
    assert data == [
        {
            "déclaration": {
                "année_indicateurs": 2020,
            },
            "entreprise": {"siren": "87654321"},
        },
        {
            "déclaration": {
                "année_indicateurs": 2020,
            },
            "entreprise": {"siren": "12345678"},
        },
    ]


async def test_dgt_dump(declaration):
    await declaration(
        siren="12345678",
        year=2020,
        compute_notes=True,
        uid="12345678-1234-5678-9012-123456789012",
        entreprise={"code_naf": "47.25Z", "région": "11", "département": "77"},
        date_publication_mesures=datetime(2020, 10, 24, 10, 11, 13),
        date_publication_objectifs=datetime(2020, 8, 12, 10, 11, 13),
        indicateurs={
            "augmentations": {
                "note": 20,
                "résultat": 1.08,
                "catégories": [0.1, 10.5, 10.3, 11.0],
                "population_favorable": "femmes",
                "objectif_de_progression": "15",
            },
            "promotions": {
                "note": 15,
                "résultat": 0.5,
                "catégories": [None, 0.1, -0.3, -0.4],
                "population_favorable": "femmes",
                "objectif_de_progression": "30",
            },
            "rémunérations": {
                "catégories": [
                    {
                        "nom": "tranche 0",
                        "tranches": {
                            "30:39": -0.03,
                            "40:49": 1.5,
                            "50:": 3.7,
                            ":29": 2.8,
                        },
                    },
                    {
                        "nom": "tranche 1",
                        "tranches": {
                            "30:39": 0.1,
                            "40:49": -11.3,
                            "50:": 11.1,
                            ":29": -10.8,
                        },
                    },
                    {
                        "nom": "tranche 2",
                        "tranches": {
                            "30:39": 2.3,
                            "40:49": 2.8,
                            "50:": 0.2,
                            ":29": 5.0,
                        },
                    },
                    {
                        "nom": "tranche 3",
                        "tranches": {
                            "30:39": 5.2,
                            "40:49": 7.1,
                            "50:": 12.2,
                            ":29": 1.1,
                        },
                    },
                ],
                "mode": "csp",
                "note": 40,
                "objectif_de_progression": "60",
                "population_favorable": "femmes",
                "résultat": 0.0,
            },
            "congés_maternité": {
                "note": 0,
                "objectif_de_progression": "18",
                "résultat": 57.0,
            },
            "hautes_rémunérations": {
                "note": 5,
                "objectif_de_progression": "75",
                "résultat": 3,
                "population_favorable": "hommes",
            },
        },
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active
    # Calculable
    assert sheet["AD1"].value == "Indic1_calculable"
    assert sheet["AD2"].value is True

    # Code NAF
    assert sheet["X1"].value == "Code_NAF"
    assert sheet["X2"].value == (
        "47.25Z - Commerce de détail de boissons en magasin spécialisé"
    )

    # Région
    assert sheet["I1"].value == "Region"
    assert sheet["I2"].value == "Île-de-France"
    assert sheet["J1"].value == "Departement"
    assert sheet["J2"].value == "Seine-et-Marne"
    assert sheet["N1"].value == "Pays"
    assert sheet["N2"].value is None

    # Dates
    assert sheet["O1"].value == "Annee_indicateurs"
    assert sheet["O2"].value == 2020
    assert sheet["P1"].value == "Periode_12mois"
    assert sheet["P2"].value is True
    assert sheet["Q1"].value == "Date_debut_periode"
    assert sheet["Q2"].value == date(2019, 1, 1)
    assert sheet["R1"].value == "Date_fin_periode"
    assert sheet["R2"].value == date(2019, 12, 31)
    assert sheet["S1"].value == "Structure"
    assert sheet["S2"].value == "Entreprise"

    # URL
    assert sheet["B1"].value == "URL_declaration"
    assert (
        sheet["B2"].value
        == "'https://egapro.travail.gouv.fr/index-egapro/declaration/?siren=12345678&year=2020"
    )

    # Indicateurs rémunérations
    assert sheet["AI1"].value == "Indic1_Ouv"
    assert sheet["AJ1"].value == "Indic1_Emp"
    assert sheet["AK1"].value == "Indic1_TAM"
    assert sheet["AL1"].value == "Indic1_IC"
    assert sheet["AI2"].value == "2.8;-0.03;1.5;3.7"
    assert sheet["AJ2"].value == "-10.8;0.1;-11.3;11.1"
    assert sheet["AK2"].value == "5;2.3;2.8;0.2"
    assert sheet["AL2"].value == "1.1;5.2;7.1;12.2"

    # Global notes
    assert sheet["BS1"].value == "Indicateur_1"
    assert sheet["BS2"].value == 40
    assert sheet["BT1"].value == "Indicateur_1_objectif"
    assert sheet["BT2"].value == "60"
    assert sheet["BU1"].value == "Indicateur_2"
    assert sheet["BU2"].value == 20
    assert sheet["BV1"].value == "Indicateur_2_objectif"
    assert sheet["BV2"].value == "15"
    assert sheet["BW1"].value == "Indicateur_3"
    assert sheet["BW2"].value == 15
    assert sheet["BX1"].value == "Indicateur_3_objectif"
    assert sheet["BX2"].value == "30"
    assert sheet["BY1"].value == "Indicateur_2et3"
    assert sheet["BY2"].value is None
    assert sheet["BZ1"].value == "Indicateur_2et3_objectif"
    assert sheet["BZ2"].value is None
    assert sheet["CA1"].value == "Indicateur_2et3_PourCent"
    assert sheet["CA2"].value is None
    assert sheet["CB1"].value == "Indicateur_2et3_ParSal"
    assert sheet["CB2"].value is None
    assert sheet["CC1"].value == "Indicateur_4"
    assert sheet["CC2"].value == 0
    assert sheet["CD1"].value == "Indicateur_4_objectif"
    assert sheet["CD2"].value == "18"
    assert sheet["CE1"].value == "Indicateur_5"
    assert sheet["CE2"].value == 5
    assert sheet["CF1"].value == "Indicateur_5_objectif"
    assert sheet["CF2"].value == "75"
    assert sheet["CG1"].value == "Nombre_total_points obtenus"
    assert sheet["CG2"].value == 80
    assert sheet["CH1"].value == "Nombre_total_points_pouvant_etre_obtenus"
    assert sheet["CH2"].value == 100
    assert sheet["CI1"].value == "Resultat_final_sur_100_points"
    assert sheet["CI2"].value == 80
    assert sheet["CJ1"].value == "Mesures_correction"
    assert sheet["CJ2"].value is None
    assert sheet["CK1"].value == "Modalites_objectifs_mesure"
    assert sheet["CK2"].value is None
    assert sheet["CL1"].value == "Date_publication_mesures"
    assert sheet["CL2"].value is None
    assert sheet["CM1"].value == "Date_publication_objectifs"
    assert sheet["CM2"].value is None
    assert sheet["CN1"].value == "Plan_relance"
    assert sheet["CN2"].value is None


async def test_dgt_dump_without_periode_suffisante(declaration):
    await declaration(
        siren="12345678",
        year=2020,
        compute_notes=True,
        uid="12345678-1234-5678-9012-123456789012",
        entreprise={"code_naf": "47.25Z", "région": "11", "département": "77"},
        déclaration={"période_suffisante": False},
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active

    # Global notes
    assert sheet["BO1"].value == "Indicateur_1"
    assert sheet["BO2"].value == "nc"
    assert sheet["BP1"].value == "Indicateur_1_objectif"
    assert sheet["BP2"].value == None
    assert sheet["BQ1"].value == "Indicateur_2"
    assert sheet["BQ2"].value == ""
    assert sheet["BR1"].value == "Indicateur_2_objectif"
    assert sheet["BR2"].value == None
    assert sheet["BS1"].value == "Indicateur_3"
    assert sheet["BS2"].value == ""
    assert sheet["BT1"].value == "Indicateur_3_objectif"
    assert sheet["BT2"].value == None
    assert sheet["BU1"].value == "Indicateur_2et3"
    assert sheet["BU2"].value == "nc"
    assert sheet["BV1"].value == "Indicateur_2et3_objectif"
    assert sheet["BV2"].value == None
    assert sheet["BY1"].value == "Indicateur_4"
    assert sheet["BY2"].value == "nc"
    assert sheet["BZ1"].value == "Indicateur_4_objectif"
    assert sheet["BZ2"].value == None
    assert sheet["CA1"].value == "Indicateur_5"
    assert sheet["CA2"].value == "nc"
    assert sheet["CB1"].value == "Indicateur_5_objectif"
    assert sheet["CB2"].value == None


async def test_dgt_dump_with_coef_mode(declaration):
    await declaration(
        siren="12345678",
        year=2020,
        uid="12345678-1234-5678-9012-123456789012",
        entreprise={"code_naf": "47.25Z", "région": "11", "département": "77"},
        indicateurs={
            "rémunérations": {
                "mode": "niveau_branche",
                "note": 25,
                "résultat": 10.6,
                "catégories": [
                    {
                        "nom": "tranche 0",
                        "tranches": {"50:": 0, ":29": 0, "30:39": 0, "40:49": 0},
                    },
                    {
                        "nom": "tranche 1",
                        "tranches": {"50:": 0, ":29": 0, "30:39": 0, "40:49": 0},
                    },
                    {
                        "nom": "tranche 2",
                        "tranches": {"50:": 56.5, ":29": 0.0, "30:39": 1.4, "40:49": 0},
                    },
                    {
                        "nom": "tranche 3",
                        "tranches": {"50:": -43.9, ":29": 0, "30:39": 0, "40:49": 0},
                    },
                    {
                        "nom": "tranche 4",
                        "tranches": {
                            "50:": -17.0,
                            ":29": -20.1,
                            "30:39": 0,
                            "40:49": 22.9,
                        },
                    },
                    {
                        "nom": "tranche 5",
                        "tranches": {
                            "50:": 6.8,
                            ":29": 7.6,
                            "40:49": 36.2,
                        },
                    },
                    {
                        "nom": "tranche 6",
                        "tranches": {
                            "50:": -3.8,
                            ":29": -13.0,
                            "30:39": 21.4,
                            "40:49": 0,
                        },
                    },
                    {
                        "nom": "tranche 7",
                        "tranches": {
                            "50:": 4.5,
                            ":29": 0,
                            "30:39": 39.6,
                            "40:49": 17.9,
                        },
                    },
                    {
                        "nom": "tranche 8",
                        "tranches": {
                            "50:": 5.0,
                            ":29": 4.2,
                            "30:39": 8.6,
                            "40:49": 59.5,
                        },
                    },
                    {
                        "nom": "tranche 9",
                        "tranches": {
                            "50:": 23.2,
                            ":29": 0,
                            "30:39": 20.0,
                            "40:49": 6.8,
                        },
                    },
                    {
                        "nom": "tranche 10",
                        "tranches": {
                            "50:": 12.0,
                            ":29": -4.8,
                            "30:39": 6.6,
                            "40:49": 16.4,
                        },
                    },
                    {
                        "nom": "tranche 11",
                        "tranches": {
                            "50:": 16.3,
                            ":29": 0,
                            "30:39": 36.6,
                            "40:49": 2.6,
                        },
                    },
                    {
                        "nom": "tranche 12",
                        "tranches": {"50:": 20.9, ":29": 0, "30:39": 0, "40:49": 7.5},
                    },
                    {
                        "nom": "tranche 13",
                        "tranches": {"50:": -22.3, ":29": 0, "30:39": 0, "40:49": 20.1},
                    },
                ],
                "population_favorable": "hommes",
            }
        },
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active

    # Calculable
    assert sheet["AD1"].value == "Indic1_calculable"
    assert sheet["AD2"].value is True
    assert sheet["AF1"].value == "Indic1_modalite_calcul"
    assert sheet["AF2"].value == "niveau_branche"

    # Indicateurs rémunérations for CSP should be empty
    assert sheet["AI1"].value == "Indic1_Ouv"
    assert sheet["AI2"].value is None
    assert sheet["AJ1"].value == "Indic1_Emp"
    assert sheet["AJ2"].value is None
    assert sheet["AK1"].value == "Indic1_TAM"
    assert sheet["AK2"].value is None
    assert sheet["AL1"].value == "Indic1_IC"
    assert sheet["AL2"].value is None
    assert sheet["AM1"].value == "Indic1_Niv0"
    assert sheet["AM2"].value == "0;0;0;0"
    assert sheet["AN1"].value == "Indic1_Niv1"
    assert sheet["AN2"].value == "0;0;0;0"
    assert sheet["AO1"].value == "Indic1_Niv2"
    assert sheet["AO2"].value == "0;1.4;0;56.5"
    assert sheet["AP1"].value == "Indic1_Niv3"
    assert sheet["AP2"].value == "0;0;0;-43.9"
    assert sheet["AQ1"].value == "Indic1_Niv4"
    assert sheet["AQ2"].value == "-20.1;0;22.9;-17"
    assert sheet["AR1"].value == "Indic1_Niv5"
    assert sheet["AR2"].value == "7.6;nc;36.2;6.8"
    assert sheet["AS1"].value == "Indic1_Niv6"
    assert sheet["AS2"].value == "-13;21.4;0;-3.8"
    assert sheet["AT1"].value == "Indic1_Niv7"
    assert sheet["AT2"].value == "0;39.6;17.9;4.5"
    assert sheet["AU1"].value == "Indic1_Niv8"
    assert sheet["AU2"].value == "4.2;8.6;59.5;5"
    assert sheet["AV1"].value == "Indic1_Niv9"
    assert sheet["AV2"].value == "0;20;6.8;23.2"
    assert sheet["AW1"].value == "Indic1_Niv10"
    assert sheet["AW2"].value == "-4.8;6.6;16.4;12"
    assert sheet["AX1"].value == "Indic1_Niv11"
    assert sheet["AX2"].value == "0;36.6;2.6;16.3"
    assert sheet["AY1"].value == "Indic1_Niv12"
    assert sheet["AY2"].value == "0;0;7.5;20.9"


async def test_dgt_dump_with_effectif_50_250(declaration):
    await declaration(
        siren="12345678",
        year=2020,
        uid="12345678-1234-5678-9012-123456789012",
        entreprise={
            "code_naf": "47.25Z",
            "région": "11",
            "département": "77",
            "effectif": {"tranche": "50:250", "total": 173},
        },
        indicateurs={
            "promotions": {},
            "augmentations": {},
            "rémunérations": {
                "mode": "niveau_autre",
                "note": 36,
                "résultat": 3.0781,
                "catégories": [
                    {"nom": "tranche 0", "tranches": {"50:": -3.7963161277}},
                    {"nom": "tranche 1", "tranches": {"50:": 17.649030204}},
                    {"nom": "tranche 2", "tranches": {}},
                    {"nom": "tranche 3", "tranches": {}},
                    {"nom": "tranche 4", "tranches": {}},
                ],
                "population_favorable": "hommes",
                "date_consultation_cse": "2020-01-27",
            },
            "congés_maternité": {"non_calculable": "absrcm"},
            "hautes_rémunérations": {"note": 10, "résultat": 5},
            "augmentations_et_promotions": {
                "note": 35,
                "résultat": 3.7625,
                "note_en_pourcentage": 25,
                "population_favorable": "hommes",
                "note_nombre_salariés": 35,
                "résultat_nombre_salariés": 1.4,
            },
        },
        déclaration={
            "date": "2020-02-07T13:27:00+00:00",
            "index": 95,
            "points": 81,
            "publication": {
                "date": "2020-02-07",
                "modalités": "Affichage dans les locaux",
            },
            "année_indicateurs": 2019,
            "points_calculables": 85,
            "fin_période_référence": "2019-12-31",
        },
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active

    # Calculable
    assert sheet["AD1"].value == "Indic1_calculable"
    assert sheet["AD2"].value is True
    assert sheet["AF1"].value == "Indic1_modalite_calcul"
    assert sheet["AF2"].value == "niveau_autre"

    # Indicateurs rémunérations for CSP should be empty
    assert sheet["AI1"].value == "Indic1_Ouv"
    assert sheet["AI2"].value is None
    assert sheet["AJ1"].value == "Indic1_Emp"
    assert sheet["AJ2"].value is None
    assert sheet["AK1"].value == "Indic1_TAM"
    assert sheet["AK2"].value is None
    assert sheet["AL1"].value == "Indic1_IC"
    assert sheet["AL2"].value is None
    assert sheet["AM1"].value == "Indic1_Niv0"
    assert sheet["AM2"].value == "nc;nc;nc;-3.8"
    assert sheet["AN1"].value == "Indic1_Niv1"
    assert sheet["AN2"].value == "nc;nc;nc;17.65"
    assert sheet["AO1"].value == "Indic1_Niv2"
    assert sheet["AO2"].value == "nc;nc;nc;nc"
    assert sheet["AP1"].value == "Indic1_Niv3"
    assert sheet["AP2"].value == "nc;nc;nc;nc"
    assert sheet["AQ1"].value == "Indic1_Niv4"
    assert sheet["AQ2"].value == "nc;nc;nc;nc"
    assert sheet["AR1"].value == "Indic1_resultat"
    assert sheet["AR2"].value == 3.0781
    assert sheet["AS1"].value == "Indic1_population_favorable"
    assert sheet["AS2"].value == "hommes"
    assert sheet["AT1"].value == "Indic2_calculable"
    assert sheet["AT2"].value is None
    assert sheet["AU1"].value == "Indic2_motif_non_calculable"
    assert sheet["AU2"].value is None
    assert sheet["AZ1"].value == "Indic2_resultat"
    assert sheet["AZ2"].value is None
    assert sheet["BA1"].value == "Indic2_population_favorable"
    assert sheet["BA2"].value is None
    assert sheet["BB1"].value == "Indic3_calculable"
    assert sheet["BB2"].value is None
    assert sheet["BC1"].value == "Indic3_motif_non_calculable"
    assert sheet["BC2"].value is None
    assert sheet["BH1"].value == "Indic3_resultat"
    assert sheet["BH2"].value is None
    assert sheet["BI1"].value == "Indic3_population_favorable"
    assert sheet["BI2"].value is None
    assert sheet["BJ1"].value == "Indic2et3_calculable"
    assert sheet["BJ2"].value is True
    assert sheet["BK1"].value == "Indic2et3_motif_non_calculable"
    assert sheet["BK2"].value is None
    assert sheet["BL1"].value == "Indic2et3_resultat_pourcent"
    assert sheet["BL2"].value == 3.7625
    assert sheet["BM1"].value == "Indic2et3_resultat_nb_sal"
    assert sheet["BM2"].value == 1.4
    assert sheet["BN1"].value == "Indic2et3_population_favorable"
    assert sheet["BN2"].value == "hommes"
    assert sheet["BO1"].value == "Indic4_calculable"
    assert sheet["BO2"].value is False
    assert sheet["BP1"].value == "Indic4_motif_non_calculable"
    assert sheet["BP2"].value == "absrcm"
    assert sheet["BQ1"].value == "Indic4_resultat"
    assert sheet["BQ2"].value is None
    assert sheet["BR1"].value == "Indic5_resultat"
    assert sheet["BR2"].value == 5
    assert sheet["BS1"].value == "Indic5_sexe_sur_represente"
    assert sheet["BS2"].value is None
    assert sheet["BT1"].value == "Indicateur_1"
    assert sheet["BT2"].value == 36
    assert sheet["BU1"].value == "Indicateur_1_objectif"
    assert sheet["BU2"].value == None
    assert sheet["BV1"].value == "Indicateur_2"
    assert sheet["BV2"].value is None
    assert sheet["BW1"].value == "Indicateur_2_objectif"
    assert sheet["BW2"].value == None
    assert sheet["BX1"].value == "Indicateur_3"
    assert sheet["BX2"].value is None
    assert sheet["BY1"].value == "Indicateur_3_objectif"
    assert sheet["BY2"].value == None
    assert sheet["BZ1"].value == "Indicateur_2et3"
    assert sheet["BZ2"].value == 35
    assert sheet["CA1"].value == "Indicateur_2et3_objectif"
    assert sheet["CA2"].value == None
    assert sheet["CB1"].value == "Indicateur_2et3_PourCent"
    assert sheet["CB2"].value == 25
    assert sheet["CC1"].value == "Indicateur_2et3_ParSal"
    assert sheet["CC2"].value == 35
    assert sheet["CD1"].value == "Indicateur_4"
    assert sheet["CD2"].value == "nc"
    assert sheet["CE1"].value == "Indicateur_4_objectif"
    assert sheet["CE2"].value == None
    assert sheet["CF1"].value == "Indicateur_5"
    assert sheet["CF2"].value == 10
    assert sheet["CG1"].value == "Indicateur_5_objectif"
    assert sheet["CG2"].value == None
    assert sheet["CH1"].value == "Nombre_total_points obtenus"
    assert sheet["CH2"].value == 81
    assert sheet["CI1"].value == "Nombre_total_points_pouvant_etre_obtenus"
    assert sheet["CI2"].value == 85
    assert sheet["CJ1"].value == "Resultat_final_sur_100_points"
    assert sheet["CJ2"].value == 95
    assert sheet["CK1"].value == "Mesures_correction"
    assert sheet["CK2"].value is None


async def test_dgt_dump_with_0_index(declaration):
    await declaration(
        siren="12345678",
        year=2020,
        uid="12345678-1234-5678-9012-123456789012",
        entreprise={
            "code_naf": "47.25Z",
            "région": "11",
            "département": "77",
            "effectif": {"tranche": "50:250", "total": 173},
        },
        indicateurs={
            "rémunérations": {
                "mode": "csp",
                "note": 0,
                "résultat": 21,
                "catégories": [
                    {
                        "nom": "ouv",
                        "tranches": {
                            "50:": 5.5,
                            ":29": 31.5,
                            "30:39": 38,
                            "40:49": 48.6,
                        },
                    },
                    {
                        "nom": "emp",
                        "tranches": {
                            "50:": 29.3,
                            ":29": -39.2,
                            "30:39": 47.1,
                            "40:49": 55.9,
                        },
                    },
                    {
                        "nom": "tam",
                        "tranches": {
                            "50:": 40.5,
                            ":29": 0,
                            "30:39": 9.6,
                            "40:49": -124.8,
                        },
                    },
                    {
                        "nom": "ic",
                        "tranches": {"50:": 74, ":29": 0, "30:39": 0, "40:49": 39.4},
                    },
                ],
                "population_favorable": "hommes",
            },
            "congés_maternité": {"non_calculable": "absrcm"},
            "hautes_rémunérations": {
                "note": 0,
                "résultat": 1,
                "population_favorable": "hommes",
            },
            "augmentations_et_promotions": {
                "note": 0,
                "résultat": 22,
                "note_en_pourcentage": 0,
                "population_favorable": "hommes",
                "note_nombre_salariés": 0,
                "résultat_nombre_salariés": 15.8,
            },
        },
        déclaration={
            "date": "2021-02-23T10:15:07.732273+00:00",
            "index": 0,
            "points": 0,
            "brouillon": False,
            "publication": {
                "date": "2021-03-08",
                "modalités": "Information aux membres du CSE le 8 mars 2021 et courrier d'information aux salariés joint avec le bulletin de paie de mars 2021. ",
            },
            "année_indicateurs": 2020,
            "points_calculables": 85,
            "mesures_correctives": "me",
            "fin_période_référence": "2020-12-31",
        },
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active

    # Calculable
    assert sheet["AD1"].value == "Indic1_calculable"
    assert sheet["AD2"].value is True
    assert sheet["AF1"].value == "Indic1_modalite_calcul"
    assert sheet["AF2"].value == "csp"

    # Indicateurs rémunérations for CSP should be empty
    assert sheet["AI1"].value == "Indic1_Ouv"
    assert sheet["AI2"].value == "31.5;38;48.6;5.5"
    assert sheet["AJ1"].value == "Indic1_Emp"
    assert sheet["AJ2"].value == "-39.2;47.1;55.9;29.3"
    assert sheet["AK1"].value == "Indic1_TAM"
    assert sheet["AK2"].value == "0;9.6;-124.8;40.5"
    assert sheet["AL1"].value == "Indic1_IC"
    assert sheet["AL2"].value == "0;0;39.4;74"
    assert sheet["AQ1"].value == "Indic1_resultat"
    assert sheet["AQ2"].value == 21
    assert sheet["AR1"].value == "Indic1_population_favorable"
    assert sheet["AR2"].value == "hommes"
    assert sheet["BI1"].value == "Indic2et3_calculable"
    assert sheet["BI2"].value is True
    assert sheet["BJ1"].value == "Indic2et3_motif_non_calculable"
    assert sheet["BJ2"].value is None
    assert sheet["BK1"].value == "Indic2et3_resultat_pourcent"
    assert sheet["BK2"].value == 22
    assert sheet["BL1"].value == "Indic2et3_resultat_nb_sal"
    assert sheet["BL2"].value == 15.8
    assert sheet["BM1"].value == "Indic2et3_population_favorable"
    assert sheet["BM2"].value == "hommes"
    assert sheet["BN1"].value == "Indic4_calculable"
    assert sheet["BN2"].value is False
    assert sheet["BO1"].value == "Indic4_motif_non_calculable"
    assert sheet["BO2"].value == "absrcm"
    assert sheet["BP1"].value == "Indic4_resultat"
    assert sheet["BP2"].value is None
    assert sheet["BQ1"].value == "Indic5_resultat"
    assert sheet["BQ2"].value == 1
    assert sheet["BR1"].value == "Indic5_sexe_sur_represente"
    assert sheet["BR2"].value == "hommes"
    assert sheet["BS1"].value == "Indicateur_1"
    assert sheet["BS2"].value == 0
    assert sheet["BT1"].value == "Indicateur_1_objectif"
    assert sheet["BT2"].value == None
    assert sheet["BU1"].value == "Indicateur_2"
    assert sheet["BU2"].value is None
    assert sheet["BV1"].value == "Indicateur_2_objectif"
    assert sheet["BV2"].value == None
    assert sheet["BW1"].value == "Indicateur_3"
    assert sheet["BW2"].value is None
    assert sheet["BX1"].value == "Indicateur_3_objectif"
    assert sheet["BX2"].value == None
    assert sheet["BY1"].value == "Indicateur_2et3"
    assert sheet["BY2"].value == 0
    assert sheet["BZ1"].value == "Indicateur_2et3_objectif"
    assert sheet["BZ2"].value == None
    assert sheet["CA1"].value == "Indicateur_2et3_PourCent"
    assert sheet["CA2"].value == 0
    assert sheet["CB1"].value == "Indicateur_2et3_ParSal"
    assert sheet["CB2"].value == 0
    assert sheet["CC1"].value == "Indicateur_4"
    assert sheet["CC2"].value == "nc"
    assert sheet["CD1"].value == "Indicateur_4_objectif"
    assert sheet["CD2"].value == None
    assert sheet["CE1"].value == "Indicateur_5"
    assert sheet["CE2"].value == 0
    assert sheet["CF1"].value == "Indicateur_5_objectif"
    assert sheet["CF2"].value == None
    assert sheet["CG1"].value == "Nombre_total_points obtenus"
    assert sheet["CG2"].value == 0
    assert sheet["CH1"].value == "Nombre_total_points_pouvant_etre_obtenus"
    assert sheet["CH2"].value == 85
    assert sheet["CI1"].value == "Resultat_final_sur_100_points"
    assert sheet["CI2"].value == 0
    assert sheet["CJ1"].value == "Mesures_correction"
    assert sheet["CJ2"].value == "me"


async def test_dgt_dump_should_compute_declaration_url_for_solen_data(declaration):
    await declaration(
        siren="12345678",
        year=2020,
        uid="123456781234-123456789012",
        source="solen-2019",
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active
    assert sheet["B1"].value == "URL_declaration"
    assert (
        sheet["B2"].value
        == "'https://egapro.travail.gouv.fr/index-egapro/declaration/?siren=12345678&year=2020"
    )


async def test_dgt_dump_with_non_ascii_chars(declaration):
    await declaration(
        siren="123456782",
        year=2020,
        uid="123456781234-123456789012",
        source="solen-2019",
        entreprise={
            "siren": "123456782",
            "adresse": "ZI   DU FOO\t BAR BP 658 \x01",
            "commune": " QUIMPER\n",
            "région": "53",
            "code_naf": "28.29B",
            "effectif": {"total": 401, "tranche": "251:999"},
            "code_postal": "29556",
            "département": "29",
            "raison_sociale": "FOOBAR  ",
        },
    )

    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active
    assert sheet["K1"].value == "Adresse"
    assert sheet["K2"].value == "ZI DU FOO BAR BP 658"
    assert sheet["M1"].value == "Commune"
    assert sheet["M2"].value == "QUIMPER"
    assert sheet["V1"].value == "Nom_Entreprise"
    assert sheet["V2"].value == "FOOBAR"


async def test_dgt_dump_with_false_periode_suffisante(declaration):
    await declaration(
        siren="123456782",
        year=2020,
        uid="123456781234-123456789012",
        source="solen-2019",
        déclaration={"période_suffisante": False},
    )

    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active
    assert sheet["P1"].value == "Periode_12mois"
    assert sheet["P2"].value is False
    assert sheet["Q1"].value == "Date_debut_periode"
    assert sheet["Q2"].value is None
    assert sheet["R1"].value == "Date_fin_periode"
    assert sheet["R2"].value is None


async def test_dgt_dump_with_foreign_company(declaration):
    await declaration(
        siren="123456782",
        year=2020,
        uid="123456781234-123456789012",
        source="solen-2019",
        entreprise={
            "code_pays": "BE",
            "adresse": None,
            "département": None,
            "région": None,
            "code_postal": None,
        },
    )

    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active
    assert sheet["I1"].value == "Region"
    assert sheet["I2"].value is None
    assert sheet["J1"].value == "Departement"
    assert sheet["J2"].value is None
    assert sheet["K1"].value == "Adresse"
    assert sheet["K2"].value is None
    assert sheet["L1"].value == "CP"
    assert sheet["L2"].value is None
    assert sheet["M1"].value == "Commune"
    assert sheet["M2"].value is None
    assert sheet["N1"].value == "Pays"
    assert sheet["N2"].value == "BELGIQUE"


async def test_dgt_dump_with_com_company(declaration):
    await declaration(
        siren="123456782",
        year=2020,
        uid="123456781234-123456789012",
        source="solen-2019",
        entreprise={
            "adresse": "RUE POUET FOO",
            "code_naf": "78.20Z",
            "code_pays": None,
            "code_postal": "97133",
            "commune": "SAINT BARTHELEMY",
            "département": None,
            "raison_sociale": "FOOBAR SAINT BARTHELEMY",
            "région": None,
        },
    )

    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook.active
    assert sheet["I1"].value == "Region"
    assert sheet["I2"].value is None
    assert sheet["J1"].value == "Departement"
    assert sheet["J2"].value is None
    assert sheet["K1"].value == "Adresse"
    assert sheet["K2"].value == "RUE POUET FOO"
    assert sheet["L1"].value == "CP"
    assert sheet["L2"].value == "97133"
    assert sheet["M1"].value == "Commune"
    assert sheet["M2"].value == "SAINT BARTHELEMY"
    assert sheet["N1"].value == "Pays"
    assert sheet["N2"].value is None


async def test_dgt_dump_should_list_UES_in_dedicated_sheet(declaration):
    await declaration(
        company="Mirabar",
        siren="87654321",
        entreprise={
            "ues": {
                "nom": "  MiraFoo ",
                "entreprises": [
                    {"raison_sociale": "MiraBaz ", "siren": "315710251"},
                    {"raison_sociale": " MiraPouet", "siren": "315710251"},
                ],
            },
            "effectif": {"tranche": "1000:"},
        },
        indicateurs={
            "promotions": {
                "note": 15,
                "résultat": 0.5,
                "catégories": [None, 0.1, -0.3, -0.4],
                "population_favorable": "femmes",
            },
            "augmentations": {},
        },
    )
    # Not an UES, should not be in the UES tab.
    await declaration(
        siren="12345678",
        year=2020,
    )
    workbook = await dgt.as_xlsx(debug=True)
    sheet = workbook["BDD REPONDANTS"]
    assert sheet["S1"].value == "Structure"
    assert sheet["S3"].value == "Unité Economique et Sociale (UES)"
    assert sheet["Z1"].value == "Nb_ets_UES"
    assert sheet["Z3"].value == 3
    sheet = workbook["BDD UES détail entreprises"]
    assert list(sheet.values) == [
        (
            "Annee_indicateurs",
            "Region",
            "Departement",
            "Adresse",
            "CP",
            "Commune",
            "Tranche_effectif",
            "Nom_UES",
            "Siren_entreprise_declarante",
            "Nom_entreprise_declarante",
            "Nom_entreprise",
            "Siren",
        ),
        (
            2020,
            "Auvergne-Rhône-Alpes",
            "Drôme",
            None,
            None,
            None,
            "1000 et plus",
            "MiraFoo",
            "87654321",
            "Mirabar",
            "Mirabar",
            "87654321",
        ),
        (
            2020,
            "Auvergne-Rhône-Alpes",
            "Drôme",
            None,
            None,
            None,
            "1000 et plus",
            "MiraFoo",
            "87654321",
            "Mirabar",
            "MiraBaz",
            "315710251",
        ),
        (
            2020,
            "Auvergne-Rhône-Alpes",
            "Drôme",
            None,
            None,
            None,
            "1000 et plus",
            "MiraFoo",
            "87654321",
            "Mirabar",
            "MiraPouet",
            "315710251",
        ),
    ]


async def test_export_public_data(declaration):
    await declaration(
        company="Mirabar",
        siren="87654321",
        year=2019,
        entreprise={"effectif": {"tranche": "1000:"}},
    )
    await declaration(
        company="FooBar",
        siren="87654322",
        year=2018,
        entreprise={"effectif": {"tranche": "1000:", "total": 1000}},
    )
    # Starting from 2020, 251:999 companies index are public.
    await declaration(
        company="KaramBar",
        siren="87654324",
        entreprise={"effectif": {"tranche": "251:999"}},
        year=2020,
    )
    out = io.StringIO()
    await exporter.public_data(out)
    out.seek(0)
    assert out.read() == (
        "Année;Structure;Tranche d'effectifs;SIREN;Raison Sociale;Nom UES;Entreprises UES (SIREN);Région;Département;Pays;Code NAF;Note Ecart rémunération;Note Ecart taux d'augmentation;Note Ecart taux de promotion;Note Retour congé maternité;Note Hautes rémunérations;Note Index\r\n"
        "2019;Entreprise;1000:;87654321;Mirabar;;;Auvergne-Rhône-Alpes;Drôme;FRANCE;;NC;NC;NC;NC;NC;26\r\n"
        "2018;Entreprise;1000:;87654322;FooBar;;;Auvergne-Rhône-Alpes;Drôme;FRANCE;;NC;NC;NC;NC;NC;26\r\n"
        "2020;Entreprise;251:999;87654324;KaramBar;;;Auvergne-Rhône-Alpes;Drôme;FRANCE;;NC;NC;NC;NC;NC;26\r\n"
    )


async def test_export_ues_public_data(declaration):
    await declaration(
        company="Mirabar",
        siren="87654321",
        year=2019,
        entreprise={
            "ues": {
                "nom": "MiraFoo",
                "entreprises": [
                    {"raison_sociale": "MiraBaz", "siren": "315710251"},
                    {"raison_sociale": "MiraPouet", "siren": "315710251"},
                ],
            },
            "effectif": {"tranche": "1000:"},
        },
    )
    out = io.StringIO()
    await exporter.public_data(out)
    out.seek(0)
    assert out.read() == (
        "Année;Structure;Tranche d'effectifs;SIREN;Raison Sociale;Nom UES;Entreprises UES (SIREN);Région;Département;Pays;Code NAF;Note Ecart rémunération;Note Ecart taux d'augmentation;Note Ecart taux de promotion;Note Retour congé maternité;Note Hautes rémunérations;Note Index\r\n"
        "2019;Unité Economique et Sociale (UES);1000:;87654321;Mirabar;MiraFoo;MiraBaz (315710251),MiraPouet (315710251);Auvergne-Rhône-Alpes;Drôme;FRANCE;;NC;NC;NC;NC;NC;26\r\n"
    )


async def test_export_public_data_with_foreign_company(declaration):
    await declaration(
        siren="123456782",
        year=2020,
        entreprise={
            "code_pays": "BE",
            "adresse": None,
            "département": None,
            "région": None,
            "code_postal": None,
        },
    )
    out = io.StringIO()
    await exporter.public_data(out)
    out.seek(0)
    assert out.read() == (
        "Année;Structure;Tranche d'effectifs;SIREN;Raison Sociale;Nom UES;Entreprises UES (SIREN);Région;Département;Pays;Code NAF;Note Ecart rémunération;Note Ecart taux d'augmentation;Note Ecart taux de promotion;Note Retour congé maternité;Note Hautes rémunérations;Note Index\r\n"
        "2020;Entreprise;50:250;123456782;Total Recall;;;;;BELGIQUE;;NC;NC;NC;NC;NC;26\r\n"
    )


async def test_full_dump(declaration):
    await declaration(
        company="Mirabar",
        siren="87654321",
        entreprise={"effectif": {"tranche": "1000:"}},
        modified_at=datetime(2021, 1, 12, 13, 14, tzinfo=timezone.utc),
        uid="44d247cc-55bf-11eb-9104-4485000df3ef",
        indicateurs={
            "rémunérations": {
                "mode": "niveau_branche",
                "note": 25,
                "résultat": 10.6,
                "catégories": [
                    {
                        "nom": "tranche 0",
                        "tranches": {"50:": 0, ":29": 0, "30:39": 0, "40:49": 0},
                    },
                    {
                        "nom": "tranche 1",
                        "tranches": {"50:": 0, ":29": 0, "30:39": 0, "40:49": 0},
                    },
                    {
                        "nom": "tranche 2",
                        "tranches": {"50:": 56.5, ":29": 0.0, "30:39": 1.4, "40:49": 0},
                    },
                    {
                        "nom": "tranche 3",
                        "tranches": {"50:": -43.9, ":29": 0, "30:39": 0, "40:49": 0},
                    },
                    {
                        "nom": "tranche 4",
                        "tranches": {
                            "50:": -17.0,
                            ":29": -20.1,
                            "30:39": 0,
                            "40:49": 22.9,
                        },
                    },
                ],
                "population_favorable": "hommes",
            }
        },
    )
    await declaration(
        company="FooBar",
        siren="87654322",
        year=2018,
        entreprise={"effectif": {"tranche": "1000:", "total": 1000}},
        modified_at=datetime(2020, 12, 13, 14, 15, 16, tzinfo=timezone.utc),
        uid="7ffde748-55bf-11eb-b460-4485000df3ef",
    )
    # Small entreprise, should not be exported.
    await declaration(
        company="MiniBar",
        siren="87654323",
        entreprise={"effectif": {"tranche": "251:999"}},
        modified_at=datetime(2021, 1, 2, 3, 4, 5, tzinfo=timezone.utc),
        uid="a42ea404-55ba-11eb-a347-4485000df3ef",
    )
    out = io.StringIO()
    await exporter.full(out)
    out.seek(0)
    assert [json.loads(s) for s in out.read().split("\n") if s] == [
        {
            "id": "44d247cc-55bf-11eb-9104-4485000df3ef",
            "entreprise": {
                "siren": "87654321",
                "région": "84",
                "effectif": {"tranche": "1000:"},
                "département": "26",
                "raison_sociale": "Mirabar",
            },
            "indicateurs": {
                "rémunérations": {
                    "catégories": [
                        {
                            "nom": "tranche 0",
                            "tranches": {":29": 0, "30:39": 0, "40:49": 0, "50:": 0},
                        },
                        {
                            "nom": "tranche 1",
                            "tranches": {":29": 0, "30:39": 0, "40:49": 0, "50:": 0},
                        },
                        {
                            "nom": "tranche 2",
                            "tranches": {
                                ":29": 0.0,
                                "30:39": 1.4,
                                "40:49": 0,
                                "50:": 56.5,
                            },
                        },
                        {
                            "nom": "tranche 3",
                            "tranches": {
                                ":29": 0,
                                "30:39": 0,
                                "40:49": 0,
                                "50:": -43.9,
                            },
                        },
                        {
                            "nom": "tranche 4",
                            "tranches": {
                                ":29": -20.1,
                                "30:39": 0,
                                "40:49": 22.9,
                                "50:": -17.0,
                            },
                        },
                    ],
                    "mode": "niveau_branche",
                    "note": 25,
                    "population_favorable": "hommes",
                    "résultat": 10.6,
                },
                "augmentations": {},
                "promotions": {},
                "congés_maternité": {},
            },
            "déclaration": {
                "date": "2021-01-12T13:14:00+00:00",
                "index": 26,
                "année_indicateurs": 2020,
                "fin_période_référence": "2019-12-31",
            },
            "déclarant": {"email": "foo@bar.com", "nom": "Martine", "prénom": "Martin"},
        },
        {
            "id": "a42ea404-55ba-11eb-a347-4485000df3ef",
            "entreprise": {
                "siren": "87654323",
                "région": "84",
                "effectif": {"tranche": "251:999"},
                "département": "26",
                "raison_sociale": "MiniBar",
            },
            "indicateurs": {
                "rémunérations": {"mode": "csp"},
                "augmentations": {},
                "promotions": {},
                "congés_maternité": {},
            },
            "déclaration": {
                "date": "2021-01-02T03:04:05+00:00",
                "index": 26,
                "année_indicateurs": 2020,
                "fin_période_référence": "2019-12-31",
            },
            "déclarant": {"email": "foo@bar.com", "nom": "Martine", "prénom": "Martin"},
        },
        {
            "id": "7ffde748-55bf-11eb-b460-4485000df3ef",
            "entreprise": {
                "siren": "87654322",
                "région": "84",
                "effectif": {"total": 1000, "tranche": "1000:"},
                "département": "26",
                "raison_sociale": "FooBar",
            },
            "indicateurs": {
                "rémunérations": {"mode": "csp"},
                "augmentations": {},
                "promotions": {},
                "congés_maternité": {},
            },
            "déclaration": {
                "date": "2020-12-13T14:15:16+00:00",
                "index": 26,
                "année_indicateurs": 2018,
                "fin_période_référence": "2019-12-31",
            },
            "déclarant": {"email": "foo@bar.com", "nom": "Martine", "prénom": "Martin"},
        },
    ]


async def test_export_indexes(declaration):
    await declaration(
        company="Mirabar",
        siren="87654321",
        year=2019,
        grade=77,
    )
    await declaration(
        company="FooBar",
        siren="87654322",
        year=2018,
        grade=52,
    )
    await declaration(
        company="MiniBar",
        siren="87654323",
        year=2019,
        grade=99,
    )
    await declaration(
        company="MiniBar",
        siren="87654323",
        year=2018,
        grade=88,
    )
    out = io.StringIO()
    await exporter.indexes(out)
    out.seek(0)
    assert out.read() == (
        "siren;year;index\r\n"
        "87654323;2018;88\r\n"
        "87654323;2019;99\r\n"
        "87654322;2018;52\r\n"
        "87654321;2019;77\r\n"
    )
