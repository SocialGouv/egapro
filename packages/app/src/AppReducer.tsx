import deepmerge from "deepmerge";
import {
  AppState,
  ActionType,
  CategorieSocioPro,
  TranchesAges
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
  effectif: {
    formValidated: "None",
    nombreSalaries: dataEffectif
  },
  indicateurUn: {
    formValidated: "None",
    csp: true,
    remunerationAnnuelle: dataIndicateurUnCsp,
    coefficientGroupFormValidated: "None",
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
              : state.indicateurTrois
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
    default:
      return state;
  }
}

export default AppReducer;
