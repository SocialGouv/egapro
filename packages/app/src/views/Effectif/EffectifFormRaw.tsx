/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";
import { Form } from "react-final-form";
import { FormState, GroupTranchesAgesEffectif } from "../../globals.d";

import { parseIntFormValue, parseIntStateValue } from "../../utils/formHelpers";
import { displayInt } from "../../utils/helpers";

import BlocForm from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { Cell, Cell2 } from "../../components/Cell";

import { displayNameTranchesAges } from "../../utils/helpers";

type Effectif = Array<{
  id: any;
  name: string;
  tranchesAges: Array<GroupTranchesAgesEffectif>;
}>;

interface Props {
  effectifRaw: Effectif;
  readOnly: boolean;
  updateEffectif: (data: Effectif) => void;
  validateEffectif: (valid: FormState) => void;
  nextLink: ReactNode;
}

const getTotalGroupNbSalarie = (
  tranchesAges: Array<GroupTranchesAgesEffectif>
) =>
  tranchesAges.reduce(
    (accGroup, { nombreSalariesHommes, nombreSalariesFemmes }) => {
      return {
        totalGroupNbSalarieHomme:
          accGroup.totalGroupNbSalarieHomme + (nombreSalariesHommes || 0),
        totalGroupNbSalarieFemme:
          accGroup.totalGroupNbSalarieFemme + (nombreSalariesFemmes || 0)
      };
    },
    { totalGroupNbSalarieHomme: 0, totalGroupNbSalarieFemme: 0 }
  );

const getTotalNbSalarie = (effectif: Effectif) =>
  effectif.reduce(
    (acc, { tranchesAges }) => {
      const {
        totalGroupNbSalarieHomme,
        totalGroupNbSalarieFemme
      } = getTotalGroupNbSalarie(tranchesAges);

      return {
        totalNbSalarieHomme: acc.totalNbSalarieHomme + totalGroupNbSalarieHomme,
        totalNbSalarieFemme: acc.totalNbSalarieFemme + totalGroupNbSalarieFemme
      };
    },
    { totalNbSalarieHomme: 0, totalNbSalarieFemme: 0 }
  );

function EffectifFormRaw({
  effectifRaw,
  readOnly,
  updateEffectif,
  validateEffectif,
  nextLink
}: Props) {
  const initialValues = {
    effectif: effectifRaw.map(({ tranchesAges, ...otherPropGroupe }: any) => ({
      ...otherPropGroupe,
      tranchesAges: tranchesAges.map(
        ({
          nombreSalariesFemmes,
          nombreSalariesHommes,
          ...otherPropsTrancheAge
        }: any) => {
          return {
            ...otherPropsTrancheAge,
            nombreSalariesFemmes: parseIntStateValue(nombreSalariesFemmes),
            nombreSalariesHommes: parseIntStateValue(nombreSalariesHommes)
          };
        }
      )
    }))
  };

  const saveForm = (formData: any) => {
    const effectif = formData.effectif.map(
      ({ tranchesAges, ...otherPropGroupe }: any) => ({
        ...otherPropGroupe,
        tranchesAges: tranchesAges.map(
          ({
            nombreSalariesFemmes,
            nombreSalariesHommes,
            ...otherPropsTrancheAge
          }: any) => {
            return {
              ...otherPropsTrancheAge,
              nombreSalariesFemmes: parseIntFormValue(nombreSalariesFemmes),
              nombreSalariesHommes: parseIntFormValue(nombreSalariesHommes)
            };
          }
        )
      })
    );
    updateEffectif(effectif);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateEffectif("Valid");
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
      {({ handleSubmit, hasValidationErrors, submitFailed }) => {
        const { totalNbSalarieHomme, totalNbSalarieFemme } = getTotalNbSalarie(
          effectifRaw
        );
        return (
          <form onSubmit={handleSubmit} css={styles.container}>
            <FormAutoSave saveForm={saveForm} />
            {effectifRaw.map(({ id, name, tranchesAges }, indexGroupe) => {
              const {
                totalGroupNbSalarieHomme,
                totalGroupNbSalarieFemme
              } = getTotalGroupNbSalarie(tranchesAges);
              return (
                <BlocForm
                  key={id}
                  title={name}
                  label="nombre de salariés"
                  footer={[
                    displayInt(totalGroupNbSalarieFemme),
                    displayInt(totalGroupNbSalarieHomme)
                  ]}
                >
                  {tranchesAges.map(({ trancheAge }, indexTrancheAge) => {
                    return (
                      <FieldInputsMenWomen
                        key={trancheAge}
                        readOnly={readOnly}
                        name={displayNameTranchesAges(trancheAge)}
                        calculable={true}
                        calculableNumber={0}
                        mask="number"
                        femmeFieldName={`effectif.${indexGroupe}.tranchesAges.${indexTrancheAge}.nombreSalariesFemmes`}
                        hommeFieldName={`effectif.${indexGroupe}.tranchesAges.${indexTrancheAge}.nombreSalariesHommes`}
                      />
                    );
                  })}
                </BlocForm>
              );
            })}

            <div css={styles.rowFoot}>
              <div css={styles.rowFootText}>total des effectifs</div>
              <Cell style={styles.rowFootCell}>
                {displayInt(totalNbSalarieFemme)}
              </Cell>
              <Cell style={styles.rowFootCell}>
                {displayInt(totalNbSalarieHomme)}
              </Cell>
            </div>

            <div css={styles.rowFoot}>
              <div css={styles.rowFootText}>soit</div>
              <Cell2 style={styles.rowFootCell}>
                {displayInt(totalNbSalarieHomme + totalNbSalarieFemme)}
              </Cell2>
            </div>

            {readOnly ? (
              <ActionBar>{nextLink}</ActionBar>
            ) : (
              <ActionBar>
                <FormSubmit
                  hasValidationErrors={hasValidationErrors}
                  submitFailed={submitFailed}
                  errorMessage="Les effectifs ne peuvent pas être validés si tous les champs ne sont pas remplis."
                />
              </ActionBar>
            )}
          </form>
        );
      }}
    </Form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
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

export default EffectifFormRaw;
