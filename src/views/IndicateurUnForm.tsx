/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { useForm } from "react-final-form-hooks";
import {
  CategorieSocioPro,
  TranchesAges,
  Groupe,
  GroupTranchesAges,
  ActionIndicateurUnData
} from "../globals.d";

import globalStyles from "../utils/globalStyles";

import { calculValiditeGroupe } from "../utils/calculsEgaProIndicateurUn";

import BlocForm from "../components/BlocForm";
import CellInputsMenWomen from "../components/CellInputsMenWomen";
import ButtonSubmit from "../components/ButtonSubmit";
import ButtonLink from "../components/ButtonLink";

import {
  displayNameCategorieSocioPro,
  displayNameTranchesAges
} from "../utils/helpers";
import { read } from "fs";

interface Props {
  data: Array<Groupe>;
  readOnly: boolean;
  updateIndicateurUn: (data: ActionIndicateurUnData) => void;
  saveIndicateurUn: (data: ActionIndicateurUnData) => void;
}

const getFieldName = (
  categorieSocioPro: CategorieSocioPro,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string =>
  "remunerationAnnuelleBrut" + categorieSocioPro + genre + trancheAge;

const parseFormValue = (value: string, defaultValue: any = undefined) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : parseInt(value, 10);

const parseStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

function IndicateurUnForm({
  data,
  readOnly,
  updateIndicateurUn,
  saveIndicateurUn
}: Props) {
  const infoFields = data.map(({ categorieSocioPro, tranchesAges }) => {
    return {
      categorieSocioPro,
      tranchesAges: tranchesAges.map(
        ({
          trancheAge,
          nombreSalariesFemmes,
          nombreSalariesHommes,
          remunerationAnnuelleBrutFemmes,
          remunerationAnnuelleBrutHommes
        }: GroupTranchesAges) => {
          return {
            trancheAge,
            calculable: calculValiditeGroupe(
              nombreSalariesFemmes || 0,
              nombreSalariesHommes || 0
            ),
            remunerationAnnuelleBrutFemmesName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Femmes"
            ),
            remunerationAnnuelleBrutFemmesValue: parseStateValue(
              remunerationAnnuelleBrutFemmes
            ),
            remunerationAnnuelleBrutHommesName: getFieldName(
              categorieSocioPro,
              trancheAge,
              "Hommes"
            ),
            remunerationAnnuelleBrutHommesValue: parseStateValue(
              remunerationAnnuelleBrutHommes
            )
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
          remunerationAnnuelleBrutFemmesName,
          remunerationAnnuelleBrutFemmesValue,
          remunerationAnnuelleBrutHommesName,
          remunerationAnnuelleBrutHommesValue
        }
      ) => {
        return {
          ...acc2,
          [remunerationAnnuelleBrutFemmesName]: remunerationAnnuelleBrutFemmesValue,
          [remunerationAnnuelleBrutHommesName]: remunerationAnnuelleBrutHommesValue
        };
      },
      acc1
    );
  }, {});

  const saveForm = (formData: any, valid: boolean = false) => {
    const data: ActionIndicateurUnData = infoFields.map(
      ({ categorieSocioPro, tranchesAges }) => ({
        categorieSocioPro,
        tranchesAges: tranchesAges.map(
          ({
            trancheAge,
            remunerationAnnuelleBrutFemmesName,
            remunerationAnnuelleBrutHommesName
          }) => ({
            trancheAge,
            remunerationAnnuelleBrutFemmes: parseFormValue(
              formData[remunerationAnnuelleBrutFemmesName]
            ),
            remunerationAnnuelleBrutHommes: parseFormValue(
              formData[remunerationAnnuelleBrutHommesName]
            )
          })
        )
      })
    );
    const actionIndicateurUn = valid ? saveIndicateurUn : updateIndicateurUn;
    actionIndicateurUn(data);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData, true);
  };

  const { form, handleSubmit, hasValidationErrors, submitFailed } = useForm({
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
    <form onSubmit={handleSubmit} css={styles.bloc}>
      {infoFields.map(({ categorieSocioPro, tranchesAges }) => {
        return (
          <BlocForm
            key={categorieSocioPro}
            title={displayNameCategorieSocioPro(categorieSocioPro)}
            label="rémunération moyenne"
          >
            {tranchesAges.map(
              ({
                trancheAge,
                calculable,
                remunerationAnnuelleBrutFemmesName,
                remunerationAnnuelleBrutHommesName
              }) => {
                return (
                  <CellInputsMenWomen
                    key={trancheAge}
                    form={form}
                    name={displayNameTranchesAges(trancheAge)}
                    readOnly={readOnly}
                    calculable={calculable}
                    femmeFieldName={remunerationAnnuelleBrutFemmesName}
                    hommeFieldName={remunerationAnnuelleBrutHommesName}
                  />
                );
              }
            )}
          </BlocForm>
        );
      })}

      {readOnly ? (
        <div css={styles.action}>
          <ButtonLink to="/indicateur2" label="suivant" />
        </div>
      ) : (
        <div css={styles.action}>
          <ButtonSubmit
            label="valider"
            outline={hasValidationErrors}
            error={submitFailed}
          />
          {submitFailed && (
            <p css={styles.actionError}>
              vous ne pouvez pas valider l’indicateur tant que vous n’avez pas
              rempli tous les champs
            </p>
          )}
        </div>
      )}
    </form>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column"
  }),
  action: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 46,
    marginBottom: 36
  }),
  actionError: css({
    marginTop: 4,
    color: globalStyles.colors.error,
    fontSize: 12
  })
};

export default memo(IndicateurUnForm, () => true);
