import { DeclarationForAPI } from "../hooks/useDeclaration"
import { addObjectifsAndMesures } from "./helpers"

const declaration: DeclarationForAPI = {
  siren: "326964418",
  year: 2021,
  data: {
    source: "formulaire",
    déclarant: {
      nom: "Mauguet",
      email: "acte@tours.fr",
      prénom: "Pierre-Olivier",
      téléphone: "0688125052",
    },
    entreprise: {
      siren: "326964418",
      commune: "LUREUIL",
      région: "24",
      code_naf: "87.10C",
      effectif: {
        total: 10,
        tranche: "50:250",
      },
      code_postal: "36220",
      adresse: "20 chemin des ardillères - Lureuil",
      département: "36",
      plan_relance: false,
      raison_sociale: "ACOGEMAS ASS CONSTRUCTION GESTION MAISON ACCUEIL SPECIALISEE LUREUIL LES DAUPHINS",
    },
    indicateurs: {
      rémunérations: {
        mode: "niveau_branche",
        note: 0,
        résultat: 50,
        catégories: [
          {
            nom: "categorie 1",
            tranches: {
              ":29": 10,
              "30:39": 11,
            },
          },
          {
            nom: "categorie 2",
          },
        ],
        population_favorable: "femmes",
        objectif_de_progression: 10,
      },
      congés_maternité: {
        non_calculable: "absrcm",
      },
      hautes_rémunérations: {
        note: 10,
        résultat: 5,
      },
      augmentations_et_promotions: {
        note: 0,
        résultat: 50,
        note_en_pourcentage: 0,
        population_favorable: "femmes",
        note_nombre_salariés: 0,
        objectif_de_progression: 1,
        résultat_nombre_salariés: 50,
      },
    },
    déclaration: {
      date: "2022-06-28T09:19:45.741175+00:00",
      index: 12,
      points: 10,
      brouillon: false,
      publication: {
        date: "2022-06-27",
        modalités: "123123",
        date_publication_mesures: "2022-06-28",
        date_publication_objectifs: "2022-06-27",
        modalités_objectifs_mesures: "voici les modalités",
      },
      année_indicateurs: 2021,
      points_calculables: 85,
      mesures_correctives: "mmo",
      période_suffisante: true,
      fin_période_référence: "2021-12-31",
    },
  },
  modified_at: 1656517469,
  declared_at: 1656407985,
}

const data = {
  objectifIndicateurUn: "12",
  objectifIndicateurDeuxTrois: "1",
  datePublicationMesures: "2022-06-28",
  datePublicationObjectifs: "2022-06-27",
  modalitesPublicationObjectifsMesures: "voici les modalités",
}

const expectedDeclaration: DeclarationForAPI = {
  siren: "326964418",
  year: 2021,
  data: {
    source: "formulaire",
    déclarant: {
      nom: "Mauguet",
      email: "acte@tours.fr",
      prénom: "Pierre-Olivier",
      téléphone: "0688125052",
    },
    entreprise: {
      siren: "326964418",
      commune: "LUREUIL",
      région: "24",
      code_naf: "87.10C",
      effectif: {
        total: 10,
        tranche: "50:250",
      },
      code_postal: "36220",
      adresse: "20 chemin des ardillères - Lureuil",
      département: "36",
      plan_relance: false,
      raison_sociale: "ACOGEMAS ASS CONSTRUCTION GESTION MAISON ACCUEIL SPECIALISEE LUREUIL LES DAUPHINS",
    },
    indicateurs: {
      rémunérations: {
        mode: "niveau_branche",
        note: 0,
        résultat: 50,
        catégories: [
          {
            nom: "categorie 1",
            tranches: {
              ":29": 10,
              "30:39": 11,
            },
          },
          {
            nom: "categorie 2",
          },
        ],
        population_favorable: "femmes",
        objectif_de_progression: 10,
      },
      congés_maternité: {
        non_calculable: "absrcm",
      },
      hautes_rémunérations: {
        note: 10,
        résultat: 5,
      },
      augmentations_et_promotions: {
        note: 0,
        résultat: 50,
        note_en_pourcentage: 0,
        population_favorable: "femmes",
        note_nombre_salariés: 0,
        objectif_de_progression: 1,
        résultat_nombre_salariés: 50,
      },
    },
    déclaration: {
      date: "2022-06-28T09:19:45.741175+00:00",
      index: 12,
      points: 10,
      brouillon: false,
      publication: {
        date: "2022-06-27",
        modalités: "123123",
        date_publication_mesures: "2022-06-28",
        date_publication_objectifs: "2022-06-27",
        modalités_objectifs_mesures: "voici les modalités",
      },
      année_indicateurs: 2021,
      points_calculables: 85,
      mesures_correctives: "mmo",
      période_suffisante: true,
      fin_période_référence: "2021-12-31",
    },
  },
  modified_at: 1656517469,
  declared_at: 1656407985,
}

test("Transform declaration with objectifs and mesures", () => {
  expect(addObjectifsAndMesures(declaration, data)).toEqual({})
})

export {}
