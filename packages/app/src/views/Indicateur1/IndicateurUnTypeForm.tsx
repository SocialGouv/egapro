/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo, useCallback, Fragment } from "react";
import { useForm } from "react-final-form-hooks";
import { ActionIndicateurUnTypeData, ActionType } from "../../globals.d";

import {
  parseBooleanFormValue,
  parseBooleanStateValue
} from "../../utils/formHelpers";

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

  const { form, handleSubmit } = useForm({
    initialValues,
    onSubmit: () => {}
  });

  form.subscribe(({ values }) => saveForm(values), { values: true });

  return (
    <form onSubmit={handleSubmit} css={styles.container}>
      <RadiosBoolean
        form={form}
        fieldName="csp"
        readOnly={readOnly}
        labelTrue={
          <Fragment>
            je renseigne par <strong>Catégories Socio-Professionnels</strong>
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
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    marginBottom: 54
  })
};

export default memo(
  IndicateurUnTypeForm,
  (prevProps, nextProps) => prevProps.readOnly === nextProps.readOnly
);
