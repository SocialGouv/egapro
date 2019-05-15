import {
  AppState,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData,
  ActionIndicateurUnData
} from "./globals.d";

function AppReducer(state: AppState, action: ActionType): AppState {
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
