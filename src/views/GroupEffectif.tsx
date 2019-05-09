/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { RouteComponentProps } from "react-router-dom";
import { useForm } from "react-final-form-hooks";
import {
  AppState,
  CategorieSocioPro,
  TranchesAges,
  GroupTranchesAges,
  ActionEffectifData
} from "../globals.d";

import globalStyles from "../utils/globalStyles";

import BlocForm from "../components/BlocForm";
import CellInputsMenWomen from "../components/CellInputsMenWomen";
import ButtonSubmit from "../components/ButtonSubmit";
import ButtonLink from "../components/ButtonLink";
import Action from "../components/Action";

import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";

interface Props extends RouteComponentProps {
  state: AppState;
  updateEffectif: (data: ActionEffectifData) => void;
  validateEffectif: (valid: boolean) => void;
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
    validateEffectif(true);
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

  return (
    <form onSubmit={handleSubmit}>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>Indication des effectifs</p>
        <p css={styles.blocSubtitle}>
          Renseignez le nombre d’effectifs par catégorie socio-professionnelle
          (CSP) et par tranche d’âge.
        </p>

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
                      readOnly={state.formEffectifValidated}
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

        {state.formEffectifValidated ? (
          <div css={styles.action}>
            <ButtonLink to="/indicateur1" label="suivant" />
            <div css={css({ marginLeft: 16 })}>
              <Action onClick={() => validateEffectif(false)}>
                modifier les données saisies
              </Action>
            </div>
          </div>
        ) : (
          <div css={styles.action}>
            <div
              css={css({ flexDirection: "column", alignItems: "flex-start" })}
            >
              <ButtonSubmit
                label="valider"
                outline={hasValidationErrors}
                error={submitFailed}
              />
              {submitFailed && (
                <p css={styles.actionError}>
                  vous ne pouvez pas valider l’indicateur tant que vous n’avez
                  pas rempli tous les champs
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

const styles = {
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
    marginTop: 46,
    marginBottom: 36
  }),
  actionError: css({
    marginTop: 4,
    color: globalStyles.colors.error,
    fontSize: 12
  })
};

export default memo(
  GroupEffectif,
  (prevProps, nextProps) =>
    prevProps.state.formEffectifValidated ===
    nextProps.state.formEffectifValidated
);
