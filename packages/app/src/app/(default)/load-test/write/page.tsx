import { entrepriseService } from "@api/core-domain/infra/services";
import { declarationRepo } from "@api/core-domain/repo";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { type NextServerPageProps } from "@common/utils/next";

const LoadTestPage = async ({ searchParams }: NextServerPageProps<never, { key: string; siren: string }>) => {
  try {
    if (!searchParams || !searchParams.key) throw new Error("Missing search params");
    if (searchParams.key !== "egapro-load-test") throw new Error("Invalid key");
  } catch (e) {
    throw new Error("Load test error");
  }
  const declaration = {
    "declaration-existante": {
      status: "creation",
    },
    "periode-reference": {
      périodeSuffisante: "oui",
      finPériodeRéférence: "2021-12-31",
      effectifTotal: 477,
    },
    entreprise: {
      type: "entreprise",
      tranche: "251:999",
      entrepriseDéclarante: {
        adresse: "96 RUE DE LEVIS 75017 PARIS 17",
        codeNaf: "62.01Z",
        codePostal: "75017",
        raisonSociale: "PERRAULT",
        siren: "532386398",
        commune: "PARIS 17",
        département: "75",
        région: "11",
      },
    },
    augmentations: {
      estCalculable: "oui",
      populationFavorable: "hommes",
      résultat: 2.1,
      note: 10,
      catégories: {
        ouv: 0,
        emp: "",
        tam: 2.4,
        ic: "",
      },
    },
    promotions: {
      estCalculable: "oui",
      populationFavorable: "hommes",
      résultat: 1.4,
      note: 15,
      catégories: {
        ouv: 5,
        emp: "",
        tam: 0.9,
        ic: "",
      },
    },
    "remunerations-resultat": {
      note: 40,
      résultat: 0,
    },
    remunerations: {
      estCalculable: "oui",
      mode: "csp",
    },
    "remunerations-csp": {
      catégories: [
        {
          nom: "ouv",
          tranches: {
            ":29": "",
            "30:39": "",
            "40:49": -1.118,
            "50:": -2.906,
          },
        },
        {
          nom: "emp",
          tranches: {
            ":29": "",
            "30:39": "",
            "40:49": "",
            "50:": "",
          },
        },
        {
          nom: "tam",
          tranches: {
            ":29": -0.941,
            "30:39": -0.854,
            "40:49": 0.583,
            "50:": -1.369,
          },
        },
        {
          nom: "ic",
          tranches: {
            ":29": "",
            "30:39": "",
            "40:49": "",
            "50:": "",
          },
        },
      ],
    },
    "conges-maternite": {
      estCalculable: "non",
      motifNonCalculabilité: "absaugpdtcm",
    },
    "hautes-remunerations": {
      populationFavorable: "femmes",
      résultat: 3,
      note: 5,
    },
    commencer: {
      annéeIndicateurs: 2021,
      siren: "532386398",
    },
    declarant: {
      accordRgpd: true,
      email: "jonathan.perrault@gmail.com",
      nom: "Perrault",
      prénom: "Jonathan",
      téléphone: "0749968164",
    },
    "resultat-global": {
      index: 82,
      points: 70,
      pointsCalculables: 85,
    },
    publication: {
      choixSiteWeb: "non",
      date: "2024-01-31",
      modalités: "gezg",
      planRelance: "oui",
    },
  } as CreateDeclarationDTO;

  try {
    const useCase = new SaveDeclaration(declarationRepo, entrepriseService);
    await useCase.execute({ declaration });
  } catch (error: unknown) {
    return <p>erreur</p>;
  }
  return <p>enregistré</p>;
};

export default LoadTestPage;
