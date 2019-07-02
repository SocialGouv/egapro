/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo, useCallback } from "react";
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
    const { csp } = formData;
    updateIndicateurUnType({ csp: parseBooleanFormValue(csp) });
  };

  const { form, handleSubmit } = useForm({
    initialValues,
    onSubmit: () => {}
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
      <RadiosBoolean
        form={form}
        fieldName="csp"
        readOnly={readOnly}
        labelTrue="je déclare en Catégories Socio-Professionnels"
        labelFalse="je déclare en Niveau ou coefficient hiérarchique"
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
