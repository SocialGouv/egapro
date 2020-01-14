import deepmerge from "deepmerge";
import { format } from "date-fns";
import {
  AppState,
  ActionType,
  CategorieSocioPro,
  TranchesAges,
  PeriodeDeclaration
} from "./globals.d";
import mapEnum from "./utils/mapEnum";
import { overwriteMerge, combineMerge } from "./utils/merge";

const dataEffectif = mapEnum(
  CategorieSocioPro,
  (categorieSocioPro: CategorieSocioPro) => ({
    categorieSocioPro,
    tranchesAges: mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
      trancheAge,
      nombreSalariesFemmes: undefined,
      nombreSalariesHommes: undefined
    }))
  })
);

const dataIndicateurUnCsp = mapEnum(
  CategorieSocioPro,
  (categorieSocioPro: CategorieSocioPro) => ({
    categorieSocioPro,
    tranchesAges: mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
      trancheAge,
      remunerationAnnuelleBrutFemmes: undefined,
      remunerationAnnuelleBrutHommes: undefined
    }))
  })
);

const dataIndicateurUnCoefGroup = {
  name: "",
  tranchesAges: mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
    trancheAge,
    nombreSalariesFemmes: undefined,
    nombreSalariesHommes: undefined,
    remunerationAnnuelleBrutFemmes: undefined,
    remunerationAnnuelleBrutHommes: undefined
  }))
};

const dataIndicateurDeux = mapEnum(
  CategorieSocioPro,
  (categorieSocioPro: CategorieSocioPro) => ({
    categorieSocioPro,
    tauxAugmentationFemmes: undefined,
    tauxAugmentationHommes: undefined
  })
);

const dataIndicateurTrois = mapEnum(
  CategorieSocioPro,
  (categorieSocioPro: CategorieSocioPro) => ({
    categorieSocioPro,
    tauxPromotionFemmes: undefined,
    tauxPromotionHommes: undefined
  })
);

const defaultState: AppState = {
  informations: {
    formValidated: "None",
    nomEntreprise: "",
    trancheEffectifs: "50 à 250",
    debutPeriodeReference: "",
    finPeriodeReference: ""
  },
  effectif: {
    formValidated: "None",
    nombreSalaries: dataEffectif
  },
  indicateurUn: {
    formValidated: "None",
    csp: true,
    remunerationAnnuelle: dataIndicateurUnCsp,
    coefficientGroupFormValidated: "None",
    coefficientEffectifFormValidated: "None",
    coefficient: []
  },
  indicateurDeux: {
    formValidated: "None",
    presenceAugmentation: true,
    tauxAugmentation: dataIndicateurDeux
  },
  indicateurTrois: {
    formValidated: "None",
    presencePromotion: true,
    tauxPromotion: dataIndicateurTrois
  },
  indicateurDeuxTrois: {
    formValidated: "None",
    presenceAugmentationPromotion: true,
    nombreAugmentationPromotionFemmes: undefined,
    nombreAugmentationPromotionHommes: undefined,
    periodeDeclaration: "unePeriodeReference" as PeriodeDeclaration
  },
  indicateurQuatre: {
    formValidated: "None",
    presenceCongeMat: true,
    nombreSalarieesPeriodeAugmentation: undefined,
    nombreSalarieesAugmentees: undefined
  },
  indicateurCinq: {
    formValidated: "None",
    nombreSalariesHommes: undefined,
    nombreSalariesFemmes: undefined
  },
  informationsEntreprise: {
    formValidated: "None",
    nomEntreprise: "",
    siren: "",
    codeNaf: "",
    region: "",
    departement: "",
    adresse: "",
    codePostal: "",
    commune: "",
    structure: "Entreprise",
    nomUES: "",
    effectifGlobalFemmes: undefined,
    effectifGlobalHommes: undefined
  },
  informationsDeclarant: {
    formValidated: "None",
    nom: "",
    prenom: "",
    tel: "",
    email: ""
  },
  informationsComplementaires: {
    formValidated: "None",
    dateConsultationCSE: "",
    anneeDeclaration: "",
    datePublication: "",
    lienPublication: ""
  },
  declaration: {
    formValidated: "None",
    dateDeclaration: ""
  }
};

function AppReducer(
  state: AppState | undefined,
  action: ActionType
): AppState | undefined {
  if (action.type === "resetState") {
    return undefined;
  }
  if (action.type === "initiateState") {
    return deepmerge(defaultState, action.data, {
      arrayMerge: overwriteMerge
    });
  }
  if (!state) {
    return state;
  }
  switch (action.type) {
    case "updateInformationsSimulation": {
      const {
        nomEntreprise,
        trancheEffectifs,
        debutPeriodeReference,
        finPeriodeReference
      } = action.data;
      if (trancheEffectifs !== state.informations.trancheEffectifs) {
        return {
          ...state,
          informations: {
            ...state.informations,
            nomEntreprise,
            trancheEffectifs,
            debutPeriodeReference,
            finPeriodeReference
          },
          effectif:
            state.effectif.formValidated === "Valid"
              ? { ...state.effectif, formValidated: "Invalid" }
              : state.effectif,
          indicateurUn:
            state.indicateurUn.formValidated === "Valid"
              ? { ...state.indicateurUn, formValidated: "Invalid" }
              : state.indicateurUn,
          indicateurDeux:
            state.indicateurDeux.formValidated === "Valid"
              ? { ...state.indicateurDeux, formValidated: "Invalid" }
              : state.indicateurDeux,
          indicateurTrois:
            state.indicateurTrois.formValidated === "Valid"
              ? { ...state.indicateurTrois, formValidated: "Invalid" }
              : state.indicateurTrois,
          indicateurDeuxTrois:
            state.indicateurDeuxTrois.formValidated === "Valid"
              ? { ...state.indicateurDeuxTrois, formValidated: "Invalid" }
              : state.indicateurDeuxTrois,
          indicateurQuatre:
            state.indicateurQuatre.formValidated === "Valid"
              ? { ...state.indicateurQuatre, formValidated: "Invalid" }
              : state.indicateurQuatre,
          indicateurCinq:
            state.indicateurCinq.formValidated === "Valid"
              ? { ...state.indicateurCinq, formValidated: "Invalid" }
              : state.indicateurCinq,
          informationsEntreprise:
            state.informationsEntreprise.formValidated === "Valid"
              ? { ...state.informationsEntreprise, formValidated: "Invalid" }
              : state.informationsEntreprise,
          informationsDeclarant:
            state.informationsDeclarant.formValidated === "Valid"
              ? { ...state.informationsDeclarant, formValidated: "Invalid" }
              : state.informationsDeclarant,
          informationsComplementaires:
            state.informationsComplementaires.formValidated === "Valid"
              ? {
                  ...state.informationsComplementaires,
                  formValidated: "Invalid"
                }
              : state.informationsComplementaires,
          declaration:
            state.declaration.formValidated === "Valid"
              ? {
                  ...state.declaration,
                  formValidated: "Invalid"
                }
              : state.declaration
        };
      }
      return {
        ...state,
        informations: {
          ...state.informations,
          nomEntreprise,
          trancheEffectifs,
          debutPeriodeReference,
          finPeriodeReference
        }
      };
    }
    case "validateInformationsSimulation": {
      return {
        ...state,
        informations: {
          ...state.informations,
          formValidated: action.valid
        }
      };
    }
    case "updateEffectif": {
      const { nombreSalaries } = action.data;
      return {
        ...state,
        effectif: { ...state.effectif, nombreSalaries }
      };
    }
    case "validateEffectif": {
      if (action.valid === "None") {
        return {
          ...state,
          effectif: { ...state.effectif, formValidated: action.valid },
          indicateurUn:
            state.indicateurUn.formValidated === "Valid" &&
            state.indicateurUn.csp
              ? { ...state.indicateurUn, formValidated: "Invalid" }
              : state.indicateurUn,
          indicateurDeux:
            state.indicateurDeux.formValidated === "Valid"
              ? { ...state.indicateurDeux, formValidated: "Invalid" }
              : state.indicateurDeux,
          indicateurTrois:
            state.indicateurTrois.formValidated === "Valid"
              ? { ...state.indicateurTrois, formValidated: "Invalid" }
              : state.indicateurTrois,
          indicateurDeuxTrois:
            state.indicateurDeuxTrois.formValidated === "Valid"
              ? { ...state.indicateurDeuxTrois, formValidated: "Invalid" }
              : state.indicateurDeuxTrois
        };
      }
      return {
        ...state,
        effectif: { ...state.effectif, formValidated: action.valid }
      };
    }
    case "updateIndicateurUnType": {
      const { csp } = action.data;
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, csp }
      };
    }
    case "updateIndicateurUnCsp": {
      const { remunerationAnnuelle } = action.data;
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, remunerationAnnuelle }
      };
    }
    case "updateIndicateurUnCoefAddGroup": {
      const newGroupCoef = { ...dataIndicateurUnCoefGroup }; // Clone to avoid mutable issues
      const coefficient = [...state.indicateurUn.coefficient, newGroupCoef];
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficient }
      };
    }
    case "updateIndicateurUnCoefDeleteGroup": {
      const coefficient = [
        ...state.indicateurUn.coefficient.slice(0, action.index),
        ...state.indicateurUn.coefficient.slice(
          action.index + 1,
          state.indicateurUn.coefficient.length
        )
      ];
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficient }
      };
    }
    case "updateIndicateurUnCoef": {
      const { coefficient } = action.data;

      const mergedCoefficient = deepmerge(
        state.indicateurUn.coefficient,
        // @ts-ignore
        coefficient,
        { arrayMerge: combineMerge }
      );
      // @ts-ignore
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, coefficient: mergedCoefficient }
      };
    }
    case "validateIndicateurUnCoefGroup": {
      return {
        ...state,
        indicateurUn: {
          ...state.indicateurUn,
          coefficientGroupFormValidated: action.valid,
          coefficientEffectifFormValidated:
            action.valid === "None" &&
            state.indicateurUn.coefficientEffectifFormValidated === "Valid"
              ? "Invalid"
              : state.indicateurUn.coefficientEffectifFormValidated,
          formValidated:
            action.valid === "None" &&
            state.indicateurUn.formValidated === "Valid"
              ? "Invalid"
              : state.indicateurUn.formValidated
        }
      };
    }
    case "validateIndicateurUnCoefEffectif": {
      return {
        ...state,
        indicateurUn: {
          ...state.indicateurUn,
          coefficientEffectifFormValidated: action.valid,
          formValidated:
            action.valid === "None" &&
            state.indicateurUn.formValidated === "Valid"
              ? "Invalid"
              : state.indicateurUn.formValidated
        }
      };
    }
    case "validateIndicateurUn": {
      return {
        ...state,
        indicateurUn: { ...state.indicateurUn, formValidated: action.valid }
      };
    }
    case "updateIndicateurDeux": {
      const { tauxAugmentation, presenceAugmentation } = action.data;
      return {
        ...state,
        indicateurDeux: {
          ...state.indicateurDeux,
          presenceAugmentation,
          tauxAugmentation
        }
      };
    }
    case "validateIndicateurDeux": {
      return {
        ...state,
        indicateurDeux: { ...state.indicateurDeux, formValidated: action.valid }
      };
    }
    case "updateIndicateurTrois": {
      const { tauxPromotion, presencePromotion } = action.data;
      return {
        ...state,
        indicateurTrois: {
          ...state.indicateurTrois,
          presencePromotion,
          tauxPromotion
        }
      };
    }
    case "validateIndicateurTrois": {
      return {
        ...state,
        indicateurTrois: {
          ...state.indicateurTrois,
          formValidated: action.valid
        }
      };
    }
    case "updateIndicateurDeuxTrois": {
      const {
        presenceAugmentationPromotion,
        nombreAugmentationPromotionFemmes,
        nombreAugmentationPromotionHommes,
        periodeDeclaration
      } = action.data;
      return {
        ...state,
        indicateurDeuxTrois: {
          ...state.indicateurDeuxTrois,
          presenceAugmentationPromotion,
          nombreAugmentationPromotionFemmes,
          nombreAugmentationPromotionHommes,
          periodeDeclaration
        }
      };
    }
    case "validateIndicateurDeuxTrois": {
      return {
        ...state,
        indicateurDeuxTrois: {
          ...state.indicateurDeuxTrois,
          formValidated: action.valid
        }
      };
    }
    case "updateIndicateurQuatre": {
      return {
        ...state,
        indicateurQuatre: {
          ...state.indicateurQuatre,
          ...action.data
        }
      };
    }
    case "validateIndicateurQuatre": {
      return {
        ...state,
        indicateurQuatre: {
          ...state.indicateurQuatre,
          formValidated: action.valid
        }
      };
    }
    case "updateIndicateurCinq": {
      return {
        ...state,
        indicateurCinq: {
          ...state.indicateurCinq,
          ...action.data
        }
      };
    }
    case "validateIndicateurCinq": {
      return {
        ...state,
        indicateurCinq: {
          ...state.indicateurCinq,
          formValidated: action.valid
        }
      };
    }
    case "updateInformationsEntreprise": {
      return {
        ...state,
        informationsEntreprise: {
          ...state.informationsEntreprise,
          ...action.data
        }
      };
    }
    case "validateInformationsEntreprise": {
      return {
        ...state,
        informationsEntreprise: {
          ...state.informationsEntreprise,
          formValidated: action.valid
        }
      };
    }
    case "updateInformationsDeclarant": {
      return {
        ...state,
        informationsDeclarant: {
          ...state.informationsDeclarant,
          ...action.data
        }
      };
    }
    case "validateInformationsDeclarant": {
      return {
        ...state,
        informationsDeclarant: {
          ...state.informationsDeclarant,
          formValidated: action.valid
        }
      };
    }
    case "updateInformationsComplementaires": {
      return {
        ...state,
        informationsComplementaires: {
          ...state.informationsComplementaires,
          ...action.data
        }
      };
    }
    case "validateInformationsComplementaires": {
      return {
        ...state,
        informationsComplementaires: {
          ...state.informationsComplementaires,
          formValidated: action.valid
        }
      };
    }
    case "updateDeclaration": {
      return {
        ...state,
        declaration: {
          ...state.declaration,
          ...action.data
        }
      };
    }
    case "validateDeclaration": {
      const dateDeclaration = format(new Date(), "dd/MM/yyyy HH:mm");
      return {
        ...state,
        declaration: {
          ...state.declaration,
          dateDeclaration:
            // Automatically set the "dateDeclaration" to now.
            action.valid === "Valid"
              ? dateDeclaration
              : state.declaration.dateDeclaration,
          formValidated: action.valid
        }
      };
    }
    default:
      return state;
  }
}

export default AppReducer;
