/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo, ReactNode } from "react";
import { useForm } from "react-final-form-hooks";
import {
  TranchesAges,
  GroupTranchesAgesIndicateurUn,
  FormState
} from "../../globals.d";

import { parseIntFormValue, parseIntStateValue } from "../../utils/formHelpers";

import BlocForm from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import ActionBar from "../../components/ActionBar";
import FormSubmit from "../../components/FormSubmit";

import { displayNameTranchesAges } from "../../utils/helpers";

interface remunerationGroup {
  id: any;
  name: string;
  trancheAge: TranchesAges;
  validiteGroupe: boolean;
  remunerationAnnuelleBrutFemmes: number | undefined;
  remunerationAnnuelleBrutHommes: number | undefined;
}

interface Props {
  ecartRemuParTrancheAge: Array<remunerationGroup>;
  readOnly: boolean;
  updateIndicateurUn: (
    data: Array<{
      id: any;
      tranchesAges: Array<GroupTranchesAgesIndicateurUn>;
    }>
  ) => void;
  validateIndicateurUn: (valid: FormState) => void;
  nextLink: ReactNode;
}

const getFieldName = (
  idGroupe: string,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "remunerationAnnuelleBrut" + idGroupe + genre + trancheAge;

const groupByCategorieSocioPro = (
  ecartRemuParTrancheAge: Array<remunerationGroup>
): Array<{
  id: any;
  name: string;
  tranchesAges: Array<remunerationGroup>;
}> => {
  const tmpArray = ecartRemuParTrancheAge.reduce(
    (acc, { id, name, ...otherAttr }) => {
      // @ts-ignore
      const el = acc[id];

      if (el) {
        return {
          ...acc,
          [id]: {
            ...el,
            tranchesAges: [...el.tranchesAges, { id, ...otherAttr }]
          }
        };
      } else {
        return {
          ...acc,
          [id]: {
            id,
            name,
            tranchesAges: [{ id, ...otherAttr }]
          }
        };
      }
    },
    {}
  );

  // @ts-ignore
  return Object.entries(tmpArray).map(([id, tranchesAges]) => tranchesAges);
};

function IndicateurUnFormRaw({
  ecartRemuParTrancheAge,
  readOnly,
  updateIndicateurUn,
  validateIndicateurUn,
  nextLink
}: Props) {
  const infoFields = groupByCategorieSocioPro(ecartRemuParTrancheAge).map(
    ({
      id,
      name,
      tranchesAges
    }: {
      id: any;
      name: string;
      tranchesAges: Array<remunerationGroup>;
    }) => {
      return {
        id,
        name,
        tranchesAges: tranchesAges.map(
          ({
            trancheAge,
            validiteGroupe,
            remunerationAnnuelleBrutFemmes,
            remunerationAnnuelleBrutHommes
          }: remunerationGroup) => {
            return {
              trancheAge,
              validiteGroupe,
              remunerationAnnuelleBrutFemmesName: getFieldName(
                id,
                trancheAge,
                "Femmes"
              ),
              remunerationAnnuelleBrutFemmesValue: parseIntStateValue(
                remunerationAnnuelleBrutFemmes
              ),
              remunerationAnnuelleBrutHommesName: getFieldName(
                id,
                trancheAge,
                "Hommes"
              ),
              remunerationAnnuelleBrutHommesValue: parseIntStateValue(
                remunerationAnnuelleBrutHommes
              )
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

  const saveForm = (formData: any) => {
    const remunerationAnnuelle = infoFields.map(({ id, tranchesAges }) => ({
      id,
      tranchesAges: tranchesAges.map(
        ({
          trancheAge,
          remunerationAnnuelleBrutFemmesName,
          remunerationAnnuelleBrutHommesName
        }) => ({
          trancheAge,
          remunerationAnnuelleBrutFemmes: parseIntFormValue(
            formData[remunerationAnnuelleBrutFemmesName]
          ),
          remunerationAnnuelleBrutHommes: parseIntFormValue(
            formData[remunerationAnnuelleBrutHommesName]
          )
        })
      )
    }));
    updateIndicateurUn(remunerationAnnuelle);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurUn("Valid");
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
    <form onSubmit={handleSubmit} css={styles.container}>
      {infoFields.map(({ id, name, tranchesAges }) => {
        return (
          <BlocForm key={id} title={name} label="rémunération moyenne">
            {tranchesAges.map(
              ({
                trancheAge,
                validiteGroupe,
                remunerationAnnuelleBrutFemmesName,
                remunerationAnnuelleBrutHommesName
              }) => {
                return (
                  <FieldInputsMenWomen
                    key={trancheAge}
                    form={form}
                    name={displayNameTranchesAges(trancheAge)}
                    readOnly={readOnly}
                    calculable={validiteGroupe}
                    calculableNumber={3}
                    mask="number"
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
        <ActionBar>{nextLink}</ActionBar>
      ) : (
        <ActionBar>
          <FormSubmit
            hasValidationErrors={hasValidationErrors}
            submitFailed={submitFailed}
            errorMessage="vous ne pouvez pas valider l’indicateur
                tant que vous n’avez pas rempli tous les champs"
          />
        </ActionBar>
      )}
    </form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  })
};

export default memo(
  IndicateurUnFormRaw,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
