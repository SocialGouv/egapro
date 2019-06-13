import {
  AppState,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData,
  ActionIndicateurUnData,
  CategorieSocioPro,
  TranchesAges
} from "./globals.d";
import mapEnum from "./utils/mapEnum";

const baseGroupTranchesAgesState = {
  nombreSalariesFemmes: undefined,
  nombreSalariesHommes: undefined,
  remunerationAnnuelleBrutFemmes: undefined,
  remunerationAnnuelleBrutHommes: undefined
};

const baseTranchesAge = mapEnum(TranchesAges, (trancheAge: TranchesAges) => ({
  trancheAge,
  ...baseGroupTranchesAgesState
}));

const baseGroupe = {
  tranchesAges: [...baseTranchesAge],
  tauxAugmentationFemmes: undefined,
  tauxAugmentationHommes: undefined,
  tauxPromotionFemmes: undefined,
  tauxPromotionHommes: undefined
};

const defaultState: AppState = {
  data: [
    {
      categorieSocioPro: CategorieSocioPro.Ouvriers,
      ...baseGroupe
    },
    {
      categorieSocioPro: CategorieSocioPro.Employes,
      ...baseGroupe
    },
    {
      categorieSocioPro: CategorieSocioPro.Techniciens,
      ...baseGroupe
    },
    {
      categorieSocioPro: CategorieSocioPro.Cadres,
      ...baseGroupe
    }
  ],
  effectif: {
    formValidated: "None"
  },
  indicateurUn: {
    formValidated: "None"
  },
  indicateurDeux: {
    formValidated: "None",
    presenceAugmentation: true
  },
  indicateurTrois: {
    formValidated: "None",
    presencePromotion: true
  },
  indicateurQuatre: {
    formValidated: "None",
    presenceAugmentation: true,
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
  if (action.type === "initiateState") {
    return Object.assign({}, defaultState, action.data);
  }
  if (!state) {
    return state;
  }
  switch (action.type) {
    case "updateEffectif": {
      return {
        ...state,
        data: updateEffectif(state.data, action.data)
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
    case "updateIndicateurUn": {
      return {
        ...state,
        data: updateIndicateurUn(state.data, action.data)
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

      const data = state.data.map((group: Groupe) => {
        const datum = tauxAugmentation.find(
          ({ categorieSocioPro }) =>
            categorieSocioPro === group.categorieSocioPro
        );
        return Object.assign({}, group, datum);
      });
      return {
        ...state,
        data,
        indicateurDeux: { ...state.indicateurDeux, presenceAugmentation }
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

      const data = state.data.map((group: Groupe) => {
        const datum = tauxPromotion.find(
          ({ categorieSocioPro }) =>
            categorieSocioPro === group.categorieSocioPro
        );
        return Object.assign({}, group, datum);
      });
      return {
        ...state,
        data,
        indicateurTrois: { ...state.indicateurTrois, presencePromotion }
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

function updateEffectif(
  stateData: AppState["data"],
  actionData: ActionEffectifData
) {
  return stateData.map((group: Groupe) => {
    const datumCat = actionData.find(
      ({ categorieSocioPro }) => categorieSocioPro === group.categorieSocioPro
    );
    return {
      ...group,
      tranchesAges: group.tranchesAges.map(
        (groupTranchesAges: GroupTranchesAges) => {
          const datumAge =
            datumCat &&
            datumCat.tranchesAges.find(
              ({ trancheAge }) => trancheAge === groupTranchesAges.trancheAge
            );
          return Object.assign({}, groupTranchesAges, datumAge);
        }
      )
    };
  });
}

function updateIndicateurUn(
  stateData: AppState["data"],
  actionData: ActionIndicateurUnData
) {
  return stateData.map((group: Groupe) => {
    const datumCat = actionData.find(
      ({ categorieSocioPro }) => categorieSocioPro === group.categorieSocioPro
    );
    return {
      ...group,
      tranchesAges: group.tranchesAges.map(
        (groupTranchesAges: GroupTranchesAges) => {
          const datumAge =
            datumCat &&
            datumCat.tranchesAges.find(
              ({ trancheAge }) => trancheAge === groupTranchesAges.trancheAge
            );
          return Object.assign({}, groupTranchesAges, datumAge);
        }
      )
    };
  });
}

export default AppReducer;
