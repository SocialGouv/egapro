/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useCallback, Fragment } from "react";
import { Form } from "react-final-form";
import { ActionIndicateurUnTypeData, ActionType } from "../../globals.d";

import {
  parseBooleanFormValue,
  parseBooleanStateValue
} from "../../utils/formHelpers";

import FormAutoSave from "../../components/FormAutoSave";
import RadiosBoolean from "../../components/RadiosBoolean";

interface Props {
  csp: boolean;
  readOnly: boolean;
  dispatch: (action: ActionType) => void;
}

function IndicateurUnTypeForm({ csp, readOnly, dispatch }: Props) {
  const updateIndicateurUnType = useCallback(
    (data: ActionIndicateurUnTypeData) =>
      dispatch({ type: "updateIndicateurUnType", data }),
    [dispatch]
  );

  const initialValues = { csp: parseBooleanStateValue(csp) };

  const saveForm = (formData: any) => {
    const { csp: cspFormData } = formData;

    if (cspFormData !== csp) {
      updateIndicateurUnType({ csp: parseBooleanFormValue(cspFormData) });
    }
  };

  return (
    <Form onSubmit={() => {}} initialValues={initialValues}>
      {({ handleSubmit, values }) => (
        <form onSubmit={handleSubmit} css={styles.container}>
          <FormAutoSave saveForm={saveForm} />
          <RadiosBoolean
            fieldName="csp"
            value={values.csp}
            readOnly={readOnly}
            labelTrue={
              <Fragment>
                je renseigne par{" "}
                <strong>Catégories Socio-Professionnelles</strong>
              </Fragment>
            }
            labelFalse={
              <Fragment>
                je renseigne par{" "}
                <strong>Niveaux ou coefficients hiérarchiques</strong>
              </Fragment>
            }
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
