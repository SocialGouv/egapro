export const DeclarationFormBuilder = {
  //TODO model => DTO (ex: FormState)
  buildDeclaration: (declaration: DeclarationDTO): DeclarationFormState => {
    return {
      augmentations: declaration.indicateurs?.augmentations?.non_calculable
        ? {
            estCalculable: "non",
            motifNonCalculabilité: declaration.indicateurs?.augmentations?.non_calculable,
          }
        : {
            estCalculable: "oui",
            note: declaration.indicateurs?.augmentations?.note ?? 0,
            populationFavorable: declaration.indicateurs?.augmentations?.population_favorable ?? "",
            résultat: declaration.indicateurs?.augmentations?.résultat ?? 0,
            catégories: [
              { nom: "ouv", écarts: declaration.indicateurs?.augmentations?.catégories?.[0] ?? null },
              { nom: "emp", écarts: declaration.indicateurs?.augmentations?.catégories?.[1] ?? null },
              { nom: "tam", écarts: declaration.indicateurs?.augmentations?.catégories?.[2] ?? null },
              { nom: "ic", écarts: declaration.indicateurs?.augmentations?.catégories?.[3] ?? null },
            ],
          },
      promotions: declaration.indicateurs?.promotions?.non_calculable
        ? {
            estCalculable: "non",
            motifNonCalculabilité: declaration.indicateurs?.promotions?.non_calculable,
          }
        : {
            estCalculable: "oui",
            note: declaration.indicateurs?.promotions?.note ?? 0,
            populationFavorable: declaration.indicateurs?.promotions?.population_favorable ?? "",
            résultat: declaration.indicateurs?.promotions?.résultat ?? 0,
            catégories: [
              { nom: "ouv", écarts: declaration.indicateurs?.promotions?.catégories?.[0] ?? null },
              { nom: "emp", écarts: declaration.indicateurs?.promotions?.catégories?.[1] ?? null },
              { nom: "tam", écarts: declaration.indicateurs?.promotions?.catégories?.[2] ?? null },
              { nom: "ic", écarts: declaration.indicateurs?.promotions?.catégories?.[3] ?? null },
            ],
          },
      commencer: {
        annéeIndicateurs: declaration.déclaration.année_indicateurs,
        siren: declaration.entreprise.siren,
      },
      "declaration-existante": {
        date: declaration.déclaration.date,
        status: "edition",
      },
      declarant: {
        accordRgpd: true,
        email: declaration.déclarant.email,
        nom: declaration.déclarant.nom || "",
        prénom: declaration.déclarant.prénom || "",
        téléphone: declaration.déclarant.téléphone || "",
      },
      remunerations: {
        estCalculable: declaration.indicateurs?.rémunérations?.non_calculable ? "non" : "oui",
        motifNonCalculabilité: declaration.indicateurs?.rémunérations?.non_calculable,
        cse: declaration.indicateurs?.rémunérations?.date_consultation_cse
          ? "oui"
          : declaration.indicateurs?.rémunérations?.mode !== "csp"
          ? "non"
          : undefined,
        dateConsultationCSE: declaration.indicateurs?.rémunérations?.date_consultation_cse,
        déclarationCalculCSP: true, // Always true for an existing declaration.
        mode: declaration.indicateurs?.rémunérations?.mode, // Always present for an existing declaration.
      },
      "remunerations-csp": {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO: improve types
        catégories: declaration.indicateurs?.rémunérations?.catégories,
      },
      "remunerations-coefficient-autre": {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO: improve types
        catégories: declaration.indicateurs?.rémunérations?.catégories,
      },
      "remunerations-coefficient-branche": {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO: improve types
        catégories: declaration.indicateurs?.rémunérations?.catégories,
      },
      "remunerations-resultat": {
        note: declaration.indicateurs?.rémunérations?.note ?? 0,
        populationFavorable: declaration.indicateurs?.rémunérations?.population_favorable ?? "",
        résultat: declaration.indicateurs?.rémunérations?.résultat ?? 0,
      },
      "augmentations-et-promotions": {
        estCalculable: declaration.indicateurs?.augmentations_et_promotions?.non_calculable ? "non" : "oui",
        motifNonCalculabilité: declaration.indicateurs?.augmentations_et_promotions?.non_calculable,
        note: declaration.indicateurs?.augmentations_et_promotions?.note ?? 0,
        populationFavorable: declaration.indicateurs?.augmentations_et_promotions?.population_favorable ?? "",
        résultat: declaration.indicateurs?.augmentations_et_promotions?.résultat ?? 0,
        résultatEquivalentSalarié: declaration.indicateurs?.augmentations_et_promotions?.résultat_nombre_salariés ?? 0,
        noteNombreSalaries: declaration.indicateurs?.augmentations_et_promotions?.note_nombre_salariés ?? 0,
        notePourcentage: declaration.indicateurs?.augmentations_et_promotions?.note_en_pourcentage ?? 0,
      },
      "conges-maternite": declaration.indicateurs?.congés_maternité?.non_calculable
        ? {
            estCalculable: "non",
            motifNonCalculabilité: declaration.indicateurs?.congés_maternité?.non_calculable,
          }
        : {
            estCalculable: "oui",
            résultat: declaration.indicateurs?.congés_maternité?.résultat ?? 0,
            note: declaration.indicateurs?.congés_maternité?.note ?? 0,
          },
      "hautes-remunerations": {
        populationFavorable: declaration.indicateurs?.hautes_rémunérations?.population_favorable ?? "",
        résultat: declaration.indicateurs?.hautes_rémunérations?.résultat ?? 0,
        note: declaration.indicateurs?.hautes_rémunérations?.note ?? 0,
      },
      entreprise: {
        tranche: declaration.entreprise.effectif!.tranche!, // Always present for an existing declaration.
        type: declaration.entreprise.ues?.nom ? "ues" : "entreprise",
        entrepriseDéclarante: buildEntreprise(declaration.entreprise),
      },
      ues: {
        nom: declaration.entreprise.ues?.nom ?? "",
        entreprises:
          declaration.entreprise.ues?.entreprises?.map(entreprise => ({
            siren: entreprise.siren,
            raisonSociale: entreprise.raison_sociale,
          })) ?? [],
      },
      "periode-reference":
        declaration.déclaration.période_suffisante === false // Value undefined (for old declaration) is considered as true.
          ? {
              périodeSuffisante: "non",
            }
          : {
              périodeSuffisante: "oui",
              effectifTotal: declaration.entreprise.effectif?.total ?? 0,
              finPériodeRéférence: declaration.déclaration.fin_période_référence ?? "",
            },
      // TODO: les autres indicateurs et autres informations
      "resultat-global": {
        mesures: declaration.déclaration.mesures_correctives,
        index: declaration.déclaration?.index,
        points: declaration.déclaration.points || 0,
        pointsCalculables: declaration.déclaration.points_calculables || 0,
      },
      publication: declaration.déclaration.publication?.url
        ? {
            choixSiteWeb: "oui",
            date: declaration.déclaration.publication.date || "",
            url: declaration.déclaration.publication.url,
            planRelance: declaration.entreprise.plan_relance ? "oui" : "non",
          }
        : {
            choixSiteWeb: "non",
            date: declaration.déclaration.publication?.date || "",
            modalités: declaration.déclaration.publication?.modalités || "",
            planRelance: declaration.entreprise.plan_relance ? "oui" : "non",
          },
    };
  },

  // TODO: DTO (ex FormState) => model (dans SaveDeclaration)
  // avant
  // toDeclarationDTO: (formState: DeclarationFormState): DeclarationDTO => {
  // après à supprimer
  //
  toDeclarationDTO: (formState: DeclarationFormState): DeclarationDTO => {
    return {
      source: "formulaire",
      déclaration: buildDeclaration(formState),
      déclarant: buildDeclarant(formState),
      entreprise: buildEntrepriseDTO(formState),
      indicateurs: buildIndicateurs(formState),
    };
  },
};

// TODO : mettre le mapper FormState -> Declaration dans SaveDeclaration
function buildDeclaration(formState: DeclarationFormState): DeclarationDTO["déclaration"] {
  if (formState.commencer?.annéeIndicateurs === undefined) throw new Error("Missing annéeIndicateurs");

  return {
    brouillon: false,
    année_indicateurs: formState.commencer?.annéeIndicateurs as AnneeIndicateur,
    fin_période_référence:
      formState["periode-reference"]?.périodeSuffisante === "oui"
        ? formState["periode-reference"].finPériodeRéférence
        : undefined,
    index: formState["resultat-global"]?.index,
    points: formState["resultat-global"]?.points,
    points_calculables: formState["resultat-global"]?.pointsCalculables,
    période_suffisante: formState["periode-reference"]?.périodeSuffisante === "oui",
    publication: {
      date: formState.publication?.date,
      modalités: formState.publication?.choixSiteWeb === "non" ? formState.publication?.modalités : undefined,
      url: formState.publication?.choixSiteWeb === "oui" ? formState.publication?.url : undefined,
    },
    mesures_correctives: formState["resultat-global"]?.mesures,
  };
}

function buildDeclarant(formState: DeclarationFormState): DeclarationDTO["déclarant"] {
  if (formState.declarant === undefined) throw new Error("Missing declarant");

  return {
    email: formState.declarant.email,
    nom: formState.declarant.nom,
    prénom: formState.declarant.prénom,
    téléphone: formState.declarant.téléphone,
  };
}
function buildEntrepriseDTO(formState: DeclarationFormState): DeclarationDTO["entreprise"] {
  if (formState.entreprise?.entrepriseDéclarante === undefined) throw new Error("Missing entreprise");

  return {
    code_naf: formState.entreprise?.entrepriseDéclarante.codeNaf,
    effectif: {
      total:
        (formState["periode-reference"]?.périodeSuffisante === "oui" && formState["periode-reference"].effectifTotal) ||
        undefined,
      tranche: formState.entreprise?.tranche,
    },
    raison_sociale: formState.entreprise?.entrepriseDéclarante.raisonSociale,
    siren: formState.entreprise?.entrepriseDéclarante.siren,
    adresse: formState.entreprise?.entrepriseDéclarante.adresse,
    code_pays: formState.entreprise?.entrepriseDéclarante.codePays,
    code_postal: formState.entreprise?.entrepriseDéclarante.codePostal,
    commune: formState.entreprise?.entrepriseDéclarante.commune,
    département: formState.entreprise?.entrepriseDéclarante.département,
    plan_relance: formState.publication?.planRelance === "oui",
    région: formState.entreprise?.entrepriseDéclarante.région,
    ues: !formState.ues?.nom
      ? undefined
      : {
          nom: formState.ues.nom,
          entreprises: formState.ues.entreprises.map(entreprise => ({
            raison_sociale: entreprise.raisonSociale,
            siren: entreprise.siren,
          })),
        },
  };
}

// Remove undefined and null values from categories.
function cleanCategories(categories?: Catégorie[]) {
  if (categories === undefined) return undefined;

  return categories.map(category => ({
    nom: category.nom,
    // Remove tranches with null or undefined values.
    tranches: (Object.keys(category.tranches) as Array<keyof TranchesAge>)
      .filter(key => category.tranches[key] !== undefined && category.tranches[key] !== null)
      .map(key => ({ [key]: category.tranches[key] }))
      .reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {}),
  }));
}

function buildIndicateurs(formState: DeclarationFormState): DeclarationDTO["indicateurs"] {
  if (formState["periode-reference"]?.périodeSuffisante === "non") return undefined;

  const rémunérations: Remunerations =
    formState.remunerations?.estCalculable === "non"
      ? { non_calculable: formState.remunerations.motifNonCalculabilité }
      : {
          note: formState["remunerations-resultat"]?.note,
          population_favorable:
            formState["remunerations-resultat"]?.populationFavorable === ""
              ? undefined
              : formState["remunerations-resultat"]?.populationFavorable,
          résultat: formState["remunerations-resultat"]?.résultat,
          catégories:
            formState.remunerations?.estCalculable === "oui"
              ? formState.remunerations.mode === "csp"
                ? (cleanCategories(formState["remunerations-csp"]?.catégories) as Remunerations["catégories"])
                : formState.remunerations.mode === "niveau_branche"
                ? (cleanCategories(
                    formState["remunerations-coefficient-branche"]?.catégories,
                  ) as Remunerations["catégories"])
                : (cleanCategories(
                    formState["remunerations-coefficient-autre"]?.catégories,
                  ) as Remunerations["catégories"])
              : undefined,
          date_consultation_cse:
            formState.remunerations?.cse === "oui" ? formState.remunerations?.dateConsultationCSE : undefined,
          mode: formState.remunerations?.mode,
        };

  const augmentations: Augmentations | undefined =
    formState.entreprise?.tranche === "50:250"
      ? undefined
      : formState.augmentations?.estCalculable === "non"
      ? {
          non_calculable: formState.augmentations.motifNonCalculabilité,
        }
      : {
          note: formState.augmentations?.note,
          population_favorable:
            formState.augmentations?.populationFavorable === ""
              ? undefined
              : formState.augmentations?.populationFavorable,
          résultat: formState.augmentations?.résultat,
          catégories: [
            formState.augmentations?.catégories?.[0].écarts || null,
            formState.augmentations?.catégories?.[1].écarts || null,
            formState.augmentations?.catégories?.[2].écarts || null,
            formState.augmentations?.catégories?.[3].écarts || null,
          ],
        };

  const promotions: Promotions | undefined =
    formState.entreprise?.tranche === "50:250"
      ? undefined
      : formState.promotions?.estCalculable === "non"
      ? {
          non_calculable: formState.promotions.motifNonCalculabilité,
        }
      : {
          résultat: formState.promotions?.résultat,
          note: formState.promotions?.note,
          population_favorable:
            formState.promotions?.populationFavorable === "" ? undefined : formState.promotions?.populationFavorable,
          catégories: [
            formState.promotions?.catégories?.[0].écarts || null,
            formState.promotions?.catégories?.[1].écarts || null,
            formState.promotions?.catégories?.[2].écarts || null,
            formState.promotions?.catégories?.[3].écarts || null,
          ],
        };

  const augmentationsEtPromotions: AugmentationsEtPromotions | undefined =
    formState.entreprise?.tranche !== "50:250"
      ? undefined
      : formState["augmentations-et-promotions"]?.estCalculable === "non"
      ? {
          non_calculable: formState["augmentations-et-promotions"].motifNonCalculabilité,
        }
      : {
          note: formState["augmentations-et-promotions"]?.note,
          note_en_pourcentage: formState["augmentations-et-promotions"]?.notePourcentage,
          note_nombre_salariés: formState["augmentations-et-promotions"]?.noteNombreSalaries,
          population_favorable:
            formState["augmentations-et-promotions"]?.populationFavorable === ""
              ? undefined
              : formState["augmentations-et-promotions"]?.populationFavorable,
          résultat: formState["augmentations-et-promotions"]?.résultat,
          résultat_nombre_salariés: formState["augmentations-et-promotions"]?.résultatEquivalentSalarié,
        };

  const congésMaternités: CongesMaternite =
    formState["conges-maternite"]?.estCalculable === "non"
      ? {
          non_calculable: formState["conges-maternite"].motifNonCalculabilité,
        }
      : {
          résultat: formState["conges-maternite"]?.résultat,
          note: formState["conges-maternite"]?.note,
        };

  const hautesRémunérations: HautesRemunerations = {
    note: formState["hautes-remunerations"]?.note,
    résultat: formState["hautes-remunerations"]?.résultat,
    population_favorable:
      formState["hautes-remunerations"]?.populationFavorable === ""
        ? undefined
        : formState["hautes-remunerations"]?.populationFavorable,
  };

  return {
    ...(augmentations && { augmentations }),
    ...(promotions && { promotions }),
    ...(augmentationsEtPromotions && { augmentations_et_promotions: augmentationsEtPromotions }),
    congés_maternité: congésMaternités,
    hautes_rémunérations: hautesRémunérations,
    rémunérations,
  };
}
