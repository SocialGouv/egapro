/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useCallback } from "react";
import { Form } from "react-final-form";
import { ActionIndicateurUnTypeData, ActionType } from "../../globals";

import FormAutoSave from "../../components/FormAutoSave";
import RadioButtons from "../../components/RadioButtons";

interface Props {
  csp: boolean;
  coef: boolean;
  autre: boolean;
  readOnly: boolean;
  dispatch: (action: ActionType) => void;
}

function IndicateurUnTypeForm({ csp, coef, autre, readOnly, dispatch }: Props) {
  const updateIndicateurUnType = useCallback(
    (data: ActionIndicateurUnTypeData) =>
      dispatch({ type: "updateIndicateurUnType", data }),
    [dispatch]
  );

  const initialValues = {
    modaliteDeclaration: coef ? "coef" : autre ? "autre" : "csp"
  };

  const saveForm = (formData: any) => {
    const { modaliteDeclaration } = formData;
    let [csp, coef, autre] = [false, false, false];
    if (modaliteDeclaration === "coef") {
      coef = true;
    } else if (modaliteDeclaration === "autre") {
      autre = true;
    } else {
      csp = true;
    }

    updateIndicateurUnType({ csp, coef, autre });
  };

  return (
    <Form onSubmit={() => {}} initialValues={initialValues}>
      {({ handleSubmit, values }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadioButtons
            fieldName="modaliteDeclaration"
            label="Modalités de calcul de l'indicateur relatif à l'écart de rémunération
          entre les femmes et les hommes"
            value={values.modaliteDeclaration}
            readOnly={readOnly}
            choices={[
              {
                label: "Par catégorie socio-professionnelle",
                value: "csp"
              },
              {
                label:
                  "Par niveau ou coefficient hiérarchique en application de la classification de branche",
                value: "coef"
              },
              {
                label:
                  "Par niveau ou coefficient hiérarchique en application d'une autre méthode de cotation des postes",
                value: "autre"
              }
            ]}
          />
        </form>
      )}
    </Form>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginBottom: 54
  })
};

export default IndicateurUnTypeForm;
