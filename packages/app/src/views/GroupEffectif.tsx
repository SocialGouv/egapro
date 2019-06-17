/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo, Fragment, useCallback } from "react";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import {
  AppState,
  ActionType,
  FormState,
  CategorieSocioPro,
  TranchesAges,
  GroupTranchesAgesEffectif,
  ActionEffectifData
} from "../globals.d";

import globalStyles from "../utils/globalStyles";
import { parseIntFormValue, parseIntStateValue } from "../utils/formHelpers";
import { displayInt } from "../utils/helpers";

import { useColumnsWidth } from "../components/GridContext";
import BlocForm from "../components/BlocForm";
import FieldInputsMenWomen from "../components/FieldInputsMenWomen";
import ButtonSubmit from "../components/ButtonSubmit";
import ActionLink from "../components/ActionLink";
import InfoBloc from "../components/InfoBloc";
import { Cell, Cell2 } from "../components/Cell";
import {
  ButtonSimulatorLink,
  TextSimulatorLink
} from "../components/SimulatorLink";

import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  state: AppState;
  dispatch: (action: ActionType) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "nombreSalaries" + categorieSocioPro + genre + trancheAge;

function GroupEffectif({ state, dispatch }: Props) {
  const updateEffectif = useCallback(
    (data: ActionEffectifData) => dispatch({ type: "updateEffectif", data }),
    [dispatch]
  );

  const validateEffectif = useCallback(
    (valid: FormState) => dispatch({ type: "validateEffectif", valid }),
    [dispatch]
  );

  const infoFields = state.effectif.nombreSalaries.map(
    ({ categorieSocioPro, tranchesAges }) => {
      return {
        categorieSocioPro,
        tranchesAges: tranchesAges.map(
          ({
            trancheAge,
            nombreSalariesFemmes,
            nombreSalariesHommes
          }: GroupTranchesAgesEffectif) => {
            return {
              trancheAge,
              nbSalarieFemmeName: getFieldName(
                categorieSocioPro,
                trancheAge,
                "Femmes"
              ),
              nbSalarieFemmeValue: parseIntStateValue(nombreSalariesFemmes),
              nbSalarieHommeName: getFieldName(
                categorieSocioPro,
                trancheAge,
                "Hommes"
              ),
              nbSalarieHommeValue: parseIntStateValue(nombreSalariesHommes)
            };
          }
        )
      };
    }
  );

  const initialValues = infoFields.reduce((acc1, { tranchesAges }) => {
    return tranchesAges.reduce(
      (
        acc2,
        {
          nbSalarieFemmeName,
          nbSalarieFemmeValue,
          nbSalarieHommeName,
          nbSalarieHommeValue
        }
      ) => {
        return {
          ...acc2,
          [nbSalarieFemmeName]: nbSalarieFemmeValue,
          [nbSalarieHommeName]: nbSalarieHommeValue
        };
      },
      acc1
    );
  }, {});

  const saveForm = (formData: any) => {
    const nombreSalaries = infoFields.map(
      ({ categorieSocioPro, tranchesAges }) => ({
        categorieSocioPro,
        tranchesAges: tranchesAges.map(
          ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => ({
            trancheAge,
            nombreSalariesFemmes: parseIntFormValue(
              formData[nbSalarieFemmeName]
            ),
            nombreSalariesHommes: parseIntFormValue(
              formData[nbSalarieHommeName]
            )
          })
        )
      })
    );
    updateEffectif({ nombreSalaries });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateEffectif("Valid");
  };

  const {
    form,
    handleSubmit,
    values,
    hasValidationErrors,
    submitFailed
  } = useForm({
    initialValues,
    onSubmit
  });

  form.subscribe(
    ({ values, dirty }) => {
      if (dirty) {
        saveForm(values);
      }
    },
    { values: true, dirty: true }
  );

  const width = useColumnsWidth(4);

  const { totalNbSalarieHomme, totalNbSalarieFemme } = infoFields.reduce(
    (acc, { tranchesAges }) => {
      const {
        totalGroupNbSalarieHomme,
        totalGroupNbSalarieFemme
      } = tranchesAges.reduce(
        (accGroup, { nbSalarieHommeName, nbSalarieFemmeName }) => {
          return {
            totalGroupNbSalarieHomme:
              accGroup.totalGroupNbSalarieHomme +
              parseIntFormValue(values[nbSalarieHommeName], 0),
            totalGroupNbSalarieFemme:
              accGroup.totalGroupNbSalarieFemme +
              parseIntFormValue(values[nbSalarieFemmeName], 0)
          };
        },
        { totalGroupNbSalarieHomme: 0, totalGroupNbSalarieFemme: 0 }
      );

      return {
        totalNbSalarieHomme: acc.totalNbSalarieHomme + totalGroupNbSalarieHomme,
        totalNbSalarieFemme: acc.totalNbSalarieFemme + totalGroupNbSalarieFemme
      };
    },
    { totalNbSalarieHomme: 0, totalNbSalarieFemme: 0 }
  );

  return (
    <div css={styles.page}>
      <p css={styles.blocTitle}>Indication des effectifs</p>
      <p css={styles.blocSubtitle}>
        Renseignez le nombre d’effectifs par catégorie socio-professionnelle
        (CSP) et par tranche d’âge.
      </p>

      <form onSubmit={handleSubmit} css={[styles.bloc, css({ width })]}>
        {infoFields.map(({ categorieSocioPro, tranchesAges }) => {
          const {
            totalGroupNbSalarieHomme,
            totalGroupNbSalarieFemme
          } = tranchesAges.reduce(
            (accGroup, { nbSalarieHommeName, nbSalarieFemmeName }) => {
              return {
                totalGroupNbSalarieHomme:
                  accGroup.totalGroupNbSalarieHomme +
                  parseIntFormValue(values[nbSalarieHommeName], 0),
                totalGroupNbSalarieFemme:
                  accGroup.totalGroupNbSalarieFemme +
                  parseIntFormValue(values[nbSalarieFemmeName], 0)
              };
            },
            { totalGroupNbSalarieHomme: 0, totalGroupNbSalarieFemme: 0 }
          );
          return (
            <BlocForm
              key={categorieSocioPro}
              title={displayNameCategorieSocioPro(categorieSocioPro)}
              label="nombre de salariés"
              footer={[
                displayInt(totalGroupNbSalarieHomme),
                displayInt(totalGroupNbSalarieFemme)
              ]}
            >
              {tranchesAges.map(
                ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => {
                  return (
                    <FieldInputsMenWomen
                      key={trancheAge}
                      readOnly={state.effectif.formValidated === "Valid"}
                      form={form}
                      name={displayNameTranchesAges(trancheAge)}
                      calculable={true}
                      calculableNumber={0}
                      mask="number"
                      femmeFieldName={nbSalarieFemmeName}
                      hommeFieldName={nbSalarieHommeName}
                    />
                  );
                }
              )}
            </BlocForm>
          );
        })}

        <div css={styles.rowFoot}>
          <div css={styles.rowFootText}>total des effectifs</div>
          <Cell style={styles.rowFootCell}>
            {displayInt(totalNbSalarieHomme)}
          </Cell>
          <Cell style={styles.rowFootCell}>
            {displayInt(totalNbSalarieFemme)}
          </Cell>
        </div>

        <div css={styles.rowFoot}>
          <div css={styles.rowFootText}>soit</div>
          <Cell2 style={styles.rowFootCell}>
            {displayInt(totalNbSalarieHomme + totalNbSalarieFemme)}
          </Cell2>
        </div>

        {state.effectif.formValidated === "Valid" ? (
          <div css={styles.action}>
            <ButtonSimulatorLink to="/indicateur1" label="suivant" />
            <ActionLink onClick={() => validateEffectif("None")}>
              modifier les données saisies
            </ActionLink>
          </div>
        ) : (
          <div css={styles.action}>
            <div
              css={css({ flexDirection: "column", alignItems: "flex-start" })}
            >
              <ButtonSubmit
                label="valider"
                outline={hasValidationErrors}
                error={submitFailed && hasValidationErrors}
              />
              {submitFailed && hasValidationErrors && (
                <p css={styles.actionError}>
                  vous ne pouvez pas valider les effectifs
                  <br />
                  tant que vous n’avez pas rempli tous les champs
                </p>
              )}
            </div>
          </div>
        )}
      </form>

      {state.effectif.formValidated === "Valid" &&
        (state.indicateurUn.formValidated === "Invalid" ||
          state.indicateurDeux.formValidated === "Invalid" ||
          state.indicateurTrois.formValidated === "Invalid") && (
          <InfoBloc
            title="Vos effectifs ont été modifiés"
            icon="cross"
            text={
              <Fragment>
                <span>
                  afin de s'assurer de la cohérence de votre index, merci de
                  vérifier les données de vos indicateurs.
                </span>
                <br />
                <span>
                  {state.indicateurUn.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur1"
                        label="aller à l'indicateur 1"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurDeux.formValidated === "Invalid" && (
                    <Fragment>
                      <TextSimulatorLink
                        to="/indicateur2"
                        label="aller à l'indicateur 2"
                      />
                      &emsp;
                    </Fragment>
                  )}
                  {state.indicateurTrois.formValidated === "Invalid" && (
                    <TextSimulatorLink
                      to="/indicateur3"
                      label="aller à l'indicateur 3"
                    />
                  )}
                </span>
              </Fragment>
            }
          />
        )}
    </div>
  );
}

const styles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    marginRight: globalStyles.grid.gutterWidth,
    marginBottom: globalStyles.grid.gutterWidth
  }),
  bloc: css({
    display: "flex",
    flexDirection: "column"
  }),
  blocTitle: css({
    marginTop: 36,
    fontSize: 32
  }),
  blocSubtitle: css({
    marginTop: 12,
    marginBottom: 54,
    fontSize: 14
  }),
  action: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 46,
    marginBottom: 36
  }),
  actionError: css({
    marginTop: 4,
    color: globalStyles.colors.error,
    fontSize: 12
  }),

  rowFoot: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    marginTop: 10,
    paddingRight: 20
  }),
  rowFootCell: css({
    fontSize: 14,
    textAlign: "center"
  }),
  rowFootText: css({
    fontStyle: "italic",
    fontSize: 14,
    marginLeft: "auto"
  })
};

export default memo(
  GroupEffectif,
  (prevProps, nextProps) =>
    prevProps.state.effectif.formValidated ===
    nextProps.state.effectif.formValidated
);
