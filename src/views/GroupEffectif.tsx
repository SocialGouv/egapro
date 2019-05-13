/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { Link, RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import {
  AppState,
  FormState,
  CategorieSocioPro,
  TranchesAges,
  GroupTranchesAges,
  ActionEffectifData
} from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { useColumnsWidth } from "../components/GridContext";
import BlocForm from "../components/BlocForm";
import CellInputsMenWomen from "../components/CellInputsMenWomen";
import ButtonSubmit from "../components/ButtonSubmit";
import ButtonLink from "../components/ButtonLink";
import ActionLink from "../components/ActionLink";

import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  state: AppState;
  updateEffectif: (data: ActionEffectifData) => void;
  validateEffectif: (valid: FormState) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "nombreSalaries" + categorieSocioPro + genre + trancheAge;

const parseFormValue = (value: string, defaultValue: any = undefined) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : parseInt(value, 10);

const parseStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

function GroupEffectif({ state, updateEffectif, validateEffectif }: Props) {
  const infoFields = state.data.map(({ categorieSocioPro, tranchesAges }) => {
    return {
      categorieSocioPro,
      tranchesAges: tranchesAges.map(
        ({
          trancheAge,
          nombreSalariesFemmes,
          nombreSalariesHommes
        }: GroupTranchesAges) => {
          return {
            trancheAge,
            nbSalarieFemmeName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Femmes"
            ),
            nbSalarieFemmeValue: parseStateValue(nombreSalariesFemmes),
            nbSalarieHommeName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Hommes"
            ),
            nbSalarieHommeValue: parseStateValue(nombreSalariesHommes)
          };
        }
      )
    };
  });

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
    const data: ActionEffectifData = infoFields.map(
      ({ categorieSocioPro, tranchesAges }) => ({
        categorieSocioPro,
        tranchesAges: tranchesAges.map(
          ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => ({
            trancheAge,
            nombreSalariesFemmes: parseFormValue(formData[nbSalarieFemmeName]),
            nombreSalariesHommes: parseFormValue(formData[nbSalarieHommeName])
          })
        )
      })
    );
    updateEffectif(data);
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

  return (
    <div css={styles.page}>
      <p css={styles.blocTitle}>Indication des effectifs</p>
      <p css={styles.blocSubtitle}>
        Renseignez le nombre d’effectifs par catégorie socio-professionnelle
        (CSP) et par tranche d’âge.
      </p>

      <form onSubmit={handleSubmit} css={[styles.bloc, css({ width })]}>
        {infoFields.map(({ categorieSocioPro, tranchesAges }) => {
          const totalNbSalarie = tranchesAges.reduce(
            (acc, { nbSalarieFemmeName, nbSalarieHommeName }) => {
              return (
                acc +
                parseFormValue(values[nbSalarieFemmeName], 0) +
                parseFormValue(values[nbSalarieHommeName], 0)
              );
            },
            0
          );
          return (
            <BlocForm
              key={categorieSocioPro}
              title={displayNameCategorieSocioPro(categorieSocioPro)}
              label="nombre de salariés"
              footer={`total ${totalNbSalarie}`}
            >
              {tranchesAges.map(
                ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => {
                  return (
                    <CellInputsMenWomen
                      key={trancheAge}
                      readOnly={state.formEffectifValidated === "Valid"}
                      form={form}
                      name={displayNameTranchesAges(trancheAge)}
                      calculable={true}
                      femmeFieldName={nbSalarieFemmeName}
                      hommeFieldName={nbSalarieHommeName}
                    />
                  );
                }
              )}
            </BlocForm>
          );
        })}

        {state.formEffectifValidated === "Valid" ? (
          <div css={styles.action}>
            <ButtonLink to="/indicateur1" label="suivant" />
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

      {state.formEffectifValidated === "Valid" &&
        state.formIndicateurUnValidated === "Invalid" && (
          <div css={styles.indicatorInvalid}>
            <p css={styles.indicatorInvalidTitle}>
              Vos effectifs ont été modifiés
            </p>
            <p css={styles.indicatorInvalidText}>
              afin de s'assurer de la cohérence de votre index, merci de
              vérifier les données de vos indicateurs.
            </p>
            <p css={styles.indicatorInvalidText}>
              <Link to="/indicateur1" css={styles.indicatorInvalidLink}>
                aller à l'indicateur 1
              </Link>
            </p>
          </div>
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

  indicatorInvalid: css({
    padding: 16,
    border: `solid ${globalStyles.colors.default} 1px`
  }),
  indicatorInvalidTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),
  indicatorInvalidText: css({
    marginTop: 4,
    fontSize: 14,
    lineHeight: "17px"
  }),
  indicatorInvalidLink: css({
    color: globalStyles.colors.default,
    textDecoration: "underline"
  })
};

export default memo(
  GroupEffectif,
  (prevProps, nextProps) =>
    prevProps.state.formEffectifValidated ===
    nextProps.state.formEffectifValidated
);
