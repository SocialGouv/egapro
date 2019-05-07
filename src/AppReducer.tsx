import {
  AppState,
  Groupe,
  GroupTranchesAges,
  ActionType,
  ActionEffectifData,
  ActionIndicateurUnData
} from "./globals.d";

function AppReducer(state: AppState, action: ActionType) {
  switch (action.type) {
    case "updateEffectif": {
      return {
        ...state,
        data: updateEffectif(state.data, action.data)
      };
    }
    case "validateEffectif": {
      return {
        ...state,
        formEffectifValidated: action.valid
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
        formIndicateurUnValidated: action.valid
      };
    }
    case "updateIndicateurDeux": {
      const data = state.data.map((group: Groupe) => {
        const datum = action.data.find(
          ({ categorieSocioPro }) =>
            categorieSocioPro === group.categorieSocioPro
        );
        return Object.assign({}, group, datum);
      });
      return {
        ...state,
        data
      };
    }
    case "updateIndicateurTrois": {
      const data = state.data.map((group: Groupe) => {
        const datum = action.data.find(
          ({ categorieSocioPro }) =>
            categorieSocioPro === group.categorieSocioPro
        );
        return Object.assign({}, group, datum);
      });
      return {
        ...state,
        data
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
