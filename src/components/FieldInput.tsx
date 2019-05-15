/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField } from "react-final-form-hooks";
import { FormApi } from "final-form";

import globalStyles from "../utils/globalStyles";

import { CellHead, Cell } from "./Cell";
import CellInput, { hasFieldError } from "./CellInput";

const required = (value: string): boolean => (value ? false : true);

const mustBeNumber = (value: string): boolean =>
  Number.isNaN(Number(value)) ? true : false;

const validate = (value: string) => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  if (!requiredError && !mustBeNumberError) {
    return undefined;
  } else {
    return { required: requiredError, mustBeNumber: mustBeNumberError };
  }
};

interface Props {
  form: FormApi;
  fieldName: string;
  label: string;
  readOnly: boolean;
}

function FieldInput({ form, fieldName, label, readOnly }: Props) {
  const field = useField(fieldName, form, validate);
  const error = hasFieldError(field.meta);

  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <CellHead style={[styles.cellHead, error && styles.cellHeadError]}>
          {field.meta.valid ? "✓ " : error ? "✕ " : null}
          {label}
        </CellHead>

        {readOnly ? (
          <Cell style={[styles.cellEmpty, styles.cellEmptyWomen]}>
            {field.input.value}
          </Cell>
        ) : (
          <CellInput field={field} style={styles.cellWomen} />
        )}
      </div>
      {error && (
        <div css={styles.error}>
          ce champs n’est pas valide, renseignez une valeur numérique
        </div>
      )}
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    height: 51,
    marginBottom: 10
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start"
  }),
  cellHead: css({
    height: 22,
    display: "flex",
    alignItems: "center",
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    fontSize: 14
  }),
  cellHeadError: css({
    color: globalStyles.colors.error,
    borderColor: "transparent"
  }),
  cellMen: css({
    borderColor: globalStyles.colors.men
  }),
  cellWomen: css({
    borderColor: globalStyles.colors.women
  }),
  cellEmpty: css({
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }),
  cellEmptyMen: css({
    color: globalStyles.colors.men
  }),
  cellEmptyWomen: css({
    color: globalStyles.colors.women
  }),
  error: css({
    display: "flex",
    alignItems: "center",
    height: 18,
    marginTop: 5,
    color: globalStyles.colors.error,
    fontSize: 11,
    fontStyle: "italic",
    lineHeight: "12px",
    borderBottom: `solid ${globalStyles.colors.error} 1px`
  })
};

export default FieldInput;
