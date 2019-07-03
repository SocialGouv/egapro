/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { memo } from "react";
import { FormApi } from "final-form";
import { useForm, useField } from "react-final-form-hooks";
import {
  GroupeCoefficient,
  ActionIndicateurUnCoefData,
  FormState
} from "../../globals.d";

import { required } from "../../utils/formHelpers";
import globalStyles from "../../utils/globalStyles";

import { useColumnsWidth, useLayoutType } from "../../components/GridContext";
import Input, { hasFieldError } from "../../components/Input";
import ActionLink from "../../components/ActionLink";
import ActionBar from "../../components/ActionBar";
import FormSubmit from "../../components/FormSubmit";

interface Props {
  coefficient: Array<GroupeCoefficient>;
  readOnly: boolean;
  updateIndicateurUnAddGroupCoef: () => void;
  updateIndicateurUnDeleteGroupCoef: (index: number) => void;
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void;
  validateIndicateurUnCoefGroup: (valid: FormState) => void;
}

function IndicateurUnCoefGroupForm({
  coefficient,
  readOnly,
  updateIndicateurUnAddGroupCoef,
  updateIndicateurUnDeleteGroupCoef,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefGroup
}: Props) {
  const infoFields = coefficient.map((groupCoef, index) => [
    "group" + index,
    groupCoef.name
  ]);
  const initialValues = infoFields.reduce(
    (acc, [name, value]) => ({ ...acc, [name]: value }),
    {}
  );

  const saveForm = (formData: any) => {
    console.log(formData);
    // updateIndicateurUnCoef({ remunerationAnnuelle });
  };

  const onSubmit = (formData: any) => {
    saveForm(formData);
    validateIndicateurUnCoefGroup("Valid");
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

  const layoutType = useLayoutType();
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7);

  return (
    <form onSubmit={handleSubmit} css={[styles.container, { width }]}>
      {infoFields.map(([name], index) => (
        <InputField
          key={name}
          name={name}
          form={form}
          index={index}
          deleteGroup={updateIndicateurUnDeleteGroupCoef}
        />
      ))}

      <ActionLink onClick={updateIndicateurUnAddGroupCoef}>
        ajouter un niveau ou coefficient hiérarchique
      </ActionLink>

      <ActionBar>
        <FormSubmit
          hasValidationErrors={hasValidationErrors}
          submitFailed={submitFailed}
          errorMessage="vous ne pouvez pas valider les groupes
                tant que vous n’avez pas rempli tous les champs"
        />
      </ActionBar>
    </form>
  );
}

// InputField

const validate = (value: string) => {
  const requiredError = required(value);

  if (!requiredError) {
    return undefined;
  } else {
    return { required: requiredError };
  }
};

function InputField({
  name,
  form,
  index,
  deleteGroup
}: {
  name: string;
  form: FormApi;
  index: number;
  deleteGroup: (index: number) => void;
}) {
  const field = useField(name, form, validate);
  const error = hasFieldError(field.meta);
  return (
    <div css={styles.inputField}>
      <label
        css={[styles.label, error && styles.labelError]}
        htmlFor={field.input.name}
      >
        {`Groupe ${index + 1}`}
      </label>
      <div css={styles.fieldRow}>
        <Input field={field} placeholder="Donnez un nom à votre groupe" />
        <ActionLink onClick={() => deleteGroup(index)} style={styles.delete}>
          supprimer le groupe
        </ActionLink>
      </div>
      <p css={styles.error}>
        {error && "vous devez donner un nom à votre groupe"}
      </p>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  }),

  inputField: css({
    alignSelf: "stretch"
  }),
  label: css({
    fontSize: 14,
    lineHeight: "17px"
  }),
  labelError: css({
    color: globalStyles.colors.error
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex"
  }),
  delete: css({
    flexShrink: 0,
    alignSelf: "flex-end",
    marginLeft: globalStyles.grid.gutterWidth,
    fontSize: 12,
    lineHeight: "15px"
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px"
  })
};

export default memo(
  IndicateurUnCoefGroupForm,
  (prevProps, nextProps) =>
    prevProps.coefficient.length === nextProps.coefficient.length
);
