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
import ButtonAction from "../../components/ButtonAction";
import ActionBar from "../../components/ActionBar";
import FormSubmit from "../../components/FormSubmit";

const getFieldName = (index: number): string => "group" + index;

interface Props {
  coefficient: Array<GroupeCoefficient>;
  readOnly: boolean;
  updateIndicateurUnCoefAddGroup: () => void;
  updateIndicateurUnCoefDeleteGroup: (index: number) => void;
  updateIndicateurUnCoef: (data: ActionIndicateurUnCoefData) => void;
  validateIndicateurUnCoefGroup: (valid: FormState) => void;
  navigateToEffectif: () => void;
}

function IndicateurUnCoefGroupForm({
  coefficient,
  readOnly,
  updateIndicateurUnCoefAddGroup,
  updateIndicateurUnCoefDeleteGroup,
  updateIndicateurUnCoef,
  validateIndicateurUnCoefGroup,
  navigateToEffectif
}: Props) {
  const infoFields = coefficient.map((groupCoef, index) => [
    getFieldName(index),
    groupCoef.name
  ]);
  const initialValues = infoFields.reduce(
    (acc, [name, value]) => ({ ...acc, [name]: value }),
    {}
  );

  const saveForm = (formData: any) => {
    if (Object.entries(formData).length !== coefficient.length) {
      return;
    }
    const newCoefficient = coefficient.map((groupCoef, index) => ({
      name: formData[getFieldName(index)]
    }));
    updateIndicateurUnCoef({ coefficient: newCoefficient });
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
          deleteGroup={updateIndicateurUnCoefDeleteGroup}
          readOnly={readOnly}
        />
      ))}

      {readOnly ? (
        <div css={styles.spacerAdd} />
      ) : (
        <ActionLink onClick={updateIndicateurUnCoefAddGroup} style={styles.add}>
          <div css={styles.addIcon}>
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.9992 24.174V1.82597M1.8252 13H24.1733"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span>ajouter un niveau ou coefficient hiérarchique</span>
        </ActionLink>
      )}

      {readOnly ? (
        <ActionBar>
          <ButtonAction onClick={navigateToEffectif} label="suivant" />
          <div css={styles.spacerActionBar} />
          <ActionLink onClick={() => validateIndicateurUnCoefGroup("None")}>
            modifier les groupes
          </ActionLink>
        </ActionBar>
      ) : (
        <ActionBar>
          <FormSubmit
            hasValidationErrors={hasValidationErrors}
            submitFailed={submitFailed}
            errorMessage="vous ne pouvez pas valider les groupes
                tant que vous n’avez pas rempli tous les champs"
          />
        </ActionBar>
      )}
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
  deleteGroup,
  readOnly
}: {
  name: string;
  form: FormApi;
  index: number;
  deleteGroup: (index: number) => void;
  readOnly: boolean;
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

      {readOnly ? (
        <div css={styles.fieldRow}>
          <div css={styles.fakeInput}>{field.input.value}</div>
        </div>
      ) : (
        <div css={styles.fieldRow}>
          <Input field={field} placeholder="Donnez un nom à votre groupe" />
          <ActionLink onClick={() => deleteGroup(index)} style={styles.delete}>
            supprimer le groupe
          </ActionLink>
        </div>
      )}

      <p css={styles.error}>
        {error && "vous devez donner un nom à votre groupe"}
      </p>
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column"
  }),

  add: css({
    display: "flex",
    alignItems: "center",
    marginTop: 46 - 18 - 5,
    textDecoration: "none"
  }),
  addIcon: css({
    width: 32,
    height: 32,
    marginRight: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: globalStyles.colors.default,
    borderRadius: 16
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
  }),

  fakeInput: css({
    alignSelf: "center",
    fontSize: 14,
    lineHeight: "17px",
    paddingLeft: 23,
    paddingRight: 23
  }),

  spacerActionBar: css({
    width: 66
  }),
  spacerAdd: css({
    height: 32,
    marginTop: 46 - 18 - 5
  })
};

export default memo(
  IndicateurUnCoefGroupForm,
  (prevProps, nextProps) =>
    prevProps.coefficient.length === nextProps.coefficient.length &&
    prevProps.readOnly === nextProps.readOnly
);
