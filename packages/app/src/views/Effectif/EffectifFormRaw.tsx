/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";
import { Form } from "react-final-form";
import {
  FormState,
  TranchesAges,
  GroupTranchesAgesEffectif
} from "../../globals.d";

import { parseIntFormValue, parseIntStateValue } from "../../utils/formHelpers";
import { displayInt } from "../../utils/helpers";

import BlocForm from "../../components/BlocForm";
import FieldInputsMenWomen from "../../components/FieldInputsMenWomen";
import ActionBar from "../../components/ActionBar";
import FormAutoSave from "../../components/FormAutoSave";
import FormSubmit from "../../components/FormSubmit";
import { Cell, Cell2 } from "../../components/Cell";

import { displayNameTranchesAges } from "../../utils/helpers";

interface Props {
  effectifRaw: Array<{
    id: any;
    name: string;
    tranchesAges: Array<GroupTranchesAgesEffectif>;
  }>;
  readOnly: boolean;
  updateEffectif: (
    data: Array<{
      id: any;
      tranchesAges: Array<GroupTranchesAgesEffectif>;
    }>
  ) => void;
  validateEffectif: (valid: FormState) => void;
  nextLink: ReactNode;
}

const getFieldName = (
  idGroupe: string,
  trancheAge: TranchesAges,
  genre: "Hommes" | "Femmes"
): string => "nombreSalaries" + idGroupe + genre + trancheAge;

const getTotalGroupNbSalarie = (
  tranchesAges: Array<{
    nbSalarieHommeName: string;
    nbSalarieFemmeName: string;
  }>,
  values: any
) =>
  tranchesAges.reduce(
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

const getTotalNbSalarie = (
  infoFields: Array<{
    tranchesAges: Array<{
      nbSalarieHommeName: string;
      nbSalarieFemmeName: string;
    }>;
  }>,
  values: any
) =>
  infoFields.reduce(
    (acc, { tranchesAges }) => {
      const {
        totalGroupNbSalarieHomme,
        totalGroupNbSalarieFemme
      } = getTotalGroupNbSalarie(tranchesAges, values);

      return {
        totalNbSalarieHomme: acc.totalNbSalarieHomme + totalGroupNbSalarieHomme,
        totalNbSalarieFemme: acc.totalNbSalarieFemme + totalGroupNbSalarieFemme
      };
    },
    { totalNbSalarieHomme: 0, totalNbSalarieFemme: 0 }
  );

function EffectifForm({
  effectifRaw,
  readOnly,
  updateEffectif,
  validateEffectif,
  nextLink
}: Props) {
  const infoFields = effectifRaw.map(({ id, name, tranchesAges }) => {
    return {
      id,
      name,
      tranchesAges: tranchesAges.map(
        ({
          trancheAge,
          nombreSalariesFemmes,
          nombreSalariesHommes
        }: GroupTranchesAgesEffectif) => {
          return {
            trancheAge,
            nbSalarieFemmeName: getFieldName(id, trancheAge, "Femmes"),
            nbSalarieFemmeValue: parseIntStateValue(nombreSalariesFemmes),
            nbSalarieHommeName: getFieldName(id, trancheAge, "Hommes"),
            nbSalarieHommeValue: parseIntStateValue(nombreSalariesHommes)
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
    const nombreSalaries = infoFields.map(({ id, tranchesAges }) => ({
      id,
      tranchesAges: tranchesAges.map(
        ({ trancheAge, nbSalarieFemmeName, nbSalarieHommeName }) => ({
          trancheAge,
          nombreSalariesFemmes: parseIntFormValue(formData[nbSalarieFemmeName]),
          nombreSalariesHommes: parseIntFormValue(formData[nbSalarieHommeName])
        })
      )
    }));
    updateEffectif(nombreSalaries);
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateEffectif("Valid");
  };

  return (
    <Form onSubmit={onSubmit} initialValues={initialValues}>
      {({ handleSubmit, values, hasValidationErrors, submitFailed }) => {
        const { totalNbSalarieHomme, totalNbSalarieFemme } = getTotalNbSalarie(
          infoFields,
          values
        );
        return (
          <form onSubmit={handleSubmit} css={styles.container}>
            <FormAutoSave saveForm={saveForm} />
            {infoFields.map(({ id, name, tranchesAges }) => {
              const {
                totalGroupNbSalarieHomme,
                totalGroupNbSalarieFemme
              } = getTotalGroupNbSalarie(tranchesAges, values);
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
                  {tranchesAges.map(
                    ({
                      trancheAge,
                      nbSalarieFemmeName,
                      nbSalarieHommeName
                    }) => {
                      return (
                        <FieldInputsMenWomen
                          key={trancheAge}
                          readOnly={readOnly}
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
                  errorMessage="vous ne pouvez pas valider les effectifs tant que vous n’avez pas rempli tous les champs"
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

export default EffectifForm;
