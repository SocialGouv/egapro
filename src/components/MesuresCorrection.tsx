/** @jsx jsx */
import { Fragment } from "react";
import { css, jsx } from "@emotion/core";
import { Field } from "react-final-form";

import globalStyles from "../utils/globalStyles";

import { required } from "../utils/formHelpers";

const choices: { [key: string]: string } = {
  mmo: "Mesures mises en œuvre",
  me: "Mesures envisagées",
  mne: "Mesures non envisagées",
};

function MesuresCorrection({
  name,
  label,
  readOnly,
}: {
  name: string;
  label: string;
  readOnly: boolean;
}) {
  return (
    <Field name={name} validate={required} component="select">
      {({ input, meta }) => (
        <div css={styles.formField}>
          <label
            css={[
              styles.label,
              meta.error && meta.touched && styles.labelError,
            ]}
            htmlFor={input.name}
          >
            {label}
          </label>
          {readOnly ? (
            <div css={styles.fieldRow}>
              <div css={styles.fakeInput}>{choices[input.value]}</div>
            </div>
          ) : (
            <Fragment>
              <div css={styles.fieldRow}>
                <select {...input}>
                  <option />
                  {Object.keys(choices).map((value) => (
                    <option value={value} key={value}>
                      {choices[value]}
                    </option>
                  ))}
                </select>
              </div>
              {meta.error && meta.touched && (
                <p css={styles.error}>
                  veuillez sélectionner un choix dans la liste
                </p>
              )}
            </Fragment>
          )}
        </div>
      )}
    </Field>
  );
}

const styles = {
  formField: css({
    marginBottom: 20,
  }),
  label: css({
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: "17px",
  }),
  labelError: css({
    color: globalStyles.colors.error,
  }),
  fieldRow: css({
    height: 38,
    marginTop: 5,
    marginBottom: 5,
    display: "flex",
    select: {
      borderRadius: 4,
      border: "1px solid",
      width: "100%",
    },
  }),
  error: css({
    height: 18,
    color: globalStyles.colors.error,
    fontSize: 12,
    textDecoration: "underline",
    lineHeight: "15px",
  }),
  fakeInput: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    paddingLeft: 23,
    paddingRight: 23,

    backgroundColor: "white",
    borderRadius: 5,

    fontSize: 14,
    lineHeight: "38px",
    cursor: "not-allowed",
  }),
};

export default MesuresCorrection;
