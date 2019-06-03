/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useField, FieldRenderProps } from "react-final-form-hooks";
import { FormApi } from "final-form";

import globalStyles from "../utils/globalStyles";

import { CellHead, Cell } from "./Cell";
import CellInput, { hasFieldError } from "./CellInput";
import { IconValid, IconInvalid } from "./Icons";

const hasMinMaxInputError = (meta: FieldRenderProps["meta"]) =>
  meta.error && meta.touched && (meta.error.minNumber || meta.error.maxNumber);

const hasPreviousFieldInputError = (meta: FieldRenderProps["meta"]) =>
  meta.error && meta.touched && meta.error.previousField;

interface Props {
  form: FormApi;
  fieldName: string;
  label: string;
  readOnly: boolean;
}

function FieldInput({ form, fieldName, label, readOnly }: Props) {
  const field = useField(fieldName, form);
  const error = hasFieldError(field.meta);
  const minMaxError = hasMinMaxInputError(field.meta);
  const previousFieldError = hasPreviousFieldInputError(field.meta);

  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <CellHead style={[styles.cellHead, error && styles.cellHeadError]}>
          <div css={styles.cellHeadInner}>
            {field.meta.valid ? (
              <div css={styles.cellHeadIcon}>
                <IconValid />
              </div>
            ) : error ? (
              <div css={styles.cellHeadIcon}>
                <IconInvalid />
              </div>
            ) : null}
            <span>{label}</span>
          </div>
        </CellHead>

        {readOnly ? (
          <Cell style={[styles.cellEmpty, styles.cellEmptyWomen]}>
            {field.input.value}
          </Cell>
        ) : (
          <CellInput field={field} style={styles.cellWomen} />
        )}
      </div>
      {error &&
        (minMaxError ? (
          <div css={styles.error}>
            ce champs doit contenir une valeur entre 0 et 10
          </div>
        ) : previousFieldError ? (
          <div css={styles.error}>
            ce champs ne peut être supérieur au précédent
          </div>
        ) : (
          <div css={styles.error}>
            ce champs n’est pas valide, renseignez une valeur numérique
          </div>
        ))}
    </div>
  );
}

export const HEIGHT = 58;
export const MARGIN_TOP = 10;

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    height: HEIGHT,
    marginTop: MARGIN_TOP
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end"
  }),
  cellHead: css({
    height: 29,
    paddingBottom: 2,
    display: "flex",
    alignItems: "flex-end",
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    fontSize: 14
  }),
  cellHeadInner: css({
    display: "flex",
    alignItems: "baseline"
  }),
  cellHeadError: css({
    color: globalStyles.colors.error,
    borderColor: "transparent"
  }),
  cellHeadIcon: css({
    marginRight: 5
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
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "12px",
    borderBottom: `solid ${globalStyles.colors.error} 1px`
  })
};

export default FieldInput;
