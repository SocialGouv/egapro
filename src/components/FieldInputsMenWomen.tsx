/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";
import { useField, FieldMetaState } from "react-final-form";

import globalStyles from "../utils/globalStyles";
import { displayPercent, displayInt } from "../utils/helpers";
import { required, mustBeNumber } from "../utils/formHelpers";

import { CellHead, Cell, Cell2 } from "./Cell";
import CellInput, { hasFieldError } from "./CellInput";
import { IconValid, IconInvalid } from "./Icons";

type ValidateFunction = (value: string) => any;

const validate: ValidateFunction = value => {
  const requiredError = required(value);
  const mustBeNumberError = mustBeNumber(value);
  if (!requiredError && !mustBeNumberError) {
    return undefined;
  } else {
    return { required: requiredError, mustBeNumber: mustBeNumberError };
  }
};

const displayReadOnlyValue = (
  value: string,
  mask?: "number" | "percent" | undefined
) => {
  if (!mask || !value) {
    return value;
  }
  return mask === "percent"
    ? displayPercent(Number(value), 2)
    : displayInt(Number(value));
};

const validateFunction = (
  validate: ValidateFunction,
  customValidate: ValidateFunction | undefined
): ValidateFunction => {
  return (value: string) => {
    const errors = validate(value);
    if (customValidate !== undefined && customValidate(value) !== undefined) {
      return { ...errors, customValidate: customValidate(value) };
    }
    return errors;
  };
};

export const getCustomValidateFieldError = (meta: FieldMetaState<string>) =>
  meta.error && meta.touched && meta.error.customValidate;

interface Props {
  readOnly: boolean;
  name: string;
  calculable: boolean;
  calculableNumber: number;
  mask?: "number" | "percent" | undefined;
  femmeFieldName: string;
  hommeFieldName: string;
  customValidateFemmes?: ValidateFunction;
  customValidateHommes?: ValidateFunction;
}

function FieldInputsMenWomen({
  name,
  readOnly,
  calculable,
  calculableNumber,
  mask,
  femmeFieldName,
  hommeFieldName,
  customValidateFemmes,
  customValidateHommes
}: Props) {
  const femmesField = useField(femmeFieldName, {
    validate: calculable
      ? validateFunction(validate, customValidateFemmes)
      : undefined
  });
  const hommesField = useField(hommeFieldName, {
    validate: calculable
      ? validateFunction(validate, customValidateHommes)
      : undefined
  });

  const femmesError = hasFieldError(femmesField.meta);
  const hommesError = hasFieldError(hommesField.meta);
  const error = femmesError || hommesError;
  const customValidateErrorFemmes = getCustomValidateFieldError(
    femmesField.meta
  );
  const customValidateErrorHommes = getCustomValidateFieldError(
    hommesField.meta
  );

  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <CellHead
          style={[
            styles.cellHead,
            !calculable && styles.cellHeadInvalid,
            error && calculable && styles.cellHeadError
          ]}
        >
          {femmesField.meta.valid && hommesField.meta.valid ? (
            calculable ? (
              <div css={styles.cellHeadIcon}>
                <IconValid />
              </div>
            ) : (
              <div css={styles.cellHeadIcon}>
                <IconInvalid />
              </div>
            )
          ) : error ? (
            <div css={styles.cellHeadIcon}>
              <IconInvalid />
            </div>
          ) : null}
          <span>{name}</span>
        </CellHead>

        {readOnly ? (
          <React.Fragment>
            <Cell style={[styles.cellEmpty, styles.cellEmptyWomen]}>
              {displayReadOnlyValue(femmesField.input.value, mask)}
            </Cell>
            <Cell style={[styles.cellEmpty, styles.cellEmptyMen]}>
              {displayReadOnlyValue(hommesField.input.value, mask)}
            </Cell>
          </React.Fragment>
        ) : calculable ? (
          <React.Fragment>
            <CellInput
              field={femmesField}
              mask={mask}
              style={styles.cellWomen}
            />

            <CellInput field={hommesField} mask={mask} style={styles.cellMen} />
          </React.Fragment>
        ) : (
          <Cell2 css={styles.cell2} />
        )}
      </div>
      {!calculable && (
        <div css={styles.invalid}>
          Le groupe ne peut pas être pris en compte pour le calcul
          <br />
          car il comporte moins de {calculableNumber} femmes ou{" "}
          {calculableNumber} hommes
        </div>
      )}
      {(customValidateErrorFemmes && calculable && (
        <div css={styles.error}>{customValidateErrorFemmes}</div>
      )) ||
        (customValidateErrorHommes && calculable && (
          <div css={styles.error}>{customValidateErrorHommes}</div>
        )) ||
        (error && calculable && (
          <div css={styles.error}>
            ce champ n’est pas valide, renseignez une valeur numérique
          </div>
        ))}
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
  cellHeadInvalid: css({
    color: globalStyles.colors.invalid,
    borderColor: "transparent"
  }),
  cellHeadError: css({
    color: globalStyles.colors.error,
    borderColor: "transparent"
  }),
  cellHeadIcon: css({
    marginRight: 5
  }),
  cell2: css({
    textAlign: "center"
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
  invalid: css({
    display: "flex",
    alignItems: "center",
    height: 23,
    paddingBottom: 4,
    color: globalStyles.colors.invalid,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "12px",
    borderBottom: `solid ${globalStyles.colors.invalid} 1px`
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

export default FieldInputsMenWomen;
