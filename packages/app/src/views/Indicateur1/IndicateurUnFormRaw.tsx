/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";
import { Form } from "react-final-form";
import {
  TranchesAges,
  GroupTranchesAgesIndicateurUn,
  FormState
} from "../../globals";

import { parseIntFormValue, parseIntStateValue } from "../../utils/formHelpers";

import BlocForm from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
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
            tranchesAges: [...el.tranchesAges, otherAttr]
          }
        };
      } else {
        return {
          ...acc,
          [id]: {
            id,
            name,
            tranchesAges: [otherAttr]
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
  const initialValues = {
    remunerationAnnuelle: groupByCategorieSocioPro(ecartRemuParTrancheAge).map(
      ({ tranchesAges, ...otherPropGroupe }: any) => ({
        ...otherPropGroupe,
        tranchesAges: tranchesAges.map(
          ({
            remunerationAnnuelleBrutFemmes,
            remunerationAnnuelleBrutHommes,
            ...otherPropsTrancheAge
          }: any) => {
            return {
              ...otherPropsTrancheAge,
              remunerationAnnuelleBrutFemmes: parseIntStateValue(
                remunerationAnnuelleBrutFemmes
              ),
              remunerationAnnuelleBrutHommes: parseIntStateValue(
                remunerationAnnuelleBrutHommes
              )
            };
          }
        )
      })
    )
  };

  const saveForm = (formData: any) => {
    const remunerationAnnuelle = formData.remunerationAnnuelle.map(
      ({ tranchesAges, ...otherPropGroupe }: any) => ({
        ...otherPropGroupe,
        tranchesAges: tranchesAges.map(
          ({
            remunerationAnnuelleBrutFemmes,
            remunerationAnnuelleBrutHommes,
            trancheAge
          }: any) => {
            return {
              trancheAge,
              remunerationAnnuelleBrutFemmes: parseIntFormValue(
                remunerationAnnuelleBrutFemmes
              ),
              remunerationAnnuelleBrutHommes: parseIntFormValue(
                remunerationAnnuelleBrutHommes
              )
            };
          }
        )
      })
    );
    updateIndicateurUn(remunerationAnnuelle);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurUn("Valid");
  };

  return (
    <Form
      onSubmit={onSubmit}
      initialValues={initialValues}
      // mandatory to not change user inputs
      // because we want to keep wrong string inside the input
      // we don't want to block string value
      initialValuesEqual={() => true}
    >
      {({ handleSubmit, hasValidationErrors, submitFailed }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          {initialValues.remunerationAnnuelle.map(
            (
              {
                id,
                name,
                tranchesAges
              }: {
                id: any;
                name: string;
                tranchesAges: Array<{
                  trancheAge: TranchesAges;
                  validiteGroupe: boolean;
                }>;
              },
              indexGroupe
            ) => {
              return (
                <BlocForm key={id} title={name} label="rémunération moyenne">
                  {tranchesAges.map(
                    ({ trancheAge, validiteGroupe }, indexTrancheAge) => {
                      return (
                        <FieldInputsMenWomen
                          key={trancheAge}
                          name={displayNameTranchesAges(trancheAge)}
                          readOnly={readOnly}
                          calculable={validiteGroupe}
                          calculableNumber={3}
                          mask="number"
                          femmeFieldName={`remunerationAnnuelle.${indexGroupe}.tranchesAges.${indexTrancheAge}.remunerationAnnuelleBrutFemmes`}
                          hommeFieldName={`remunerationAnnuelle.${indexGroupe}.tranchesAges.${indexTrancheAge}.remunerationAnnuelleBrutHommes`}
                        />
                      );
                    }
                  )}
                </BlocForm>
              );
            }
          )}

          {readOnly ? (
            <ActionBar>{nextLink}</ActionBar>
          ) : (
            <ActionBar>
              <FormSubmit
                hasValidationErrors={hasValidationErrors}
                submitFailed={submitFailed}
                errorMessage="L’indicateur ne peut pas être validé si tous les champs ne sont pas remplis."
              />
            </ActionBar>
          )}
        </form>
      )}
    </Form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  })
};

export default IndicateurUnFormRaw;
