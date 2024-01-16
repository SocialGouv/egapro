import { entrepriseService } from "@api/core-domain/infra/services";
import { declarationRepo } from "@api/core-domain/repo";
import { SaveDeclaration } from "@api/core-domain/useCases/SaveDeclaration";
import { DeclarationSpecificationError } from "@common/core-domain/domain/specification/DeclarationSpecification";
import { type CreateDeclarationDTO } from "@common/core-domain/dtos/DeclarationDTO";
import { ValidationError } from "@common/shared-domain";
import { type NextRouteHandler } from "@common/utils/next";
import { NextResponse } from "next/server";

// Note: [revalidatePath bug](https://github.com/vercel/next.js/issues/49387). Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
// export const revalidate = 86400; // 24h
export const dynamic = "force-dynamic";
// export const revalidate = 86_400; // 24h

export const POST: NextRouteHandler = async (req: Request) => {
  const body = await req.json();

  if (!body) return NextResponse.json({ ok: false, error: "No body" });
  if (body.key !== "egapro-load-test") return NextResponse.json({ ok: false, error: "unauthorized" });

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
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    if (error instanceof DeclarationSpecificationError || error instanceof ValidationError) {
      return NextResponse.json({
        ok: false,
        error: error.message ?? error.previousError,
      });
    }
    return NextResponse.json({
      ok: false,
      error: "Une erreur est survenue, veuillez réessayer.",
    });
  }
};
