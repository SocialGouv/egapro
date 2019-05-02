/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";
import { useField } from "react-final-form-hooks";
import { FormApi } from "final-form";

import globalStyles from "../utils/globalStyles";

import { CellHead, Cell2 } from "./Cell";
import CellInput from "./CellInput";

const validate = (value: string) => (value ? undefined : "Required");

interface Props {
  form: FormApi;
  name: string;
  calculable: boolean;
  femmeFieldName: string;
  hommeFieldName: string;
}

function CellInputsMenWomen({
  form,
  name,
  calculable,
  femmeFieldName,
  hommeFieldName
}: Props) {
  const femmesField = useField(femmeFieldName, form, validate);
  const hommesField = useField(hommeFieldName, form, validate);

  const femmesError = femmesField.meta.error && femmesField.meta.touched;
  const hommesError = hommesField.meta.error && hommesField.meta.touched;
  const error = femmesError && hommesError;

  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <CellHead style={[styles.cellHead, error && styles.cellHeadError]}>
          {name}
        </CellHead>

        {calculable ? (
          <React.Fragment>
            <CellInput field={hommesField} style={styles.cellMen} />

            <CellInput field={femmesField} style={styles.cellWomen} />
          </React.Fragment>
        ) : (
          <Cell2 css={styles.cell2}>Non Calculable</Cell2>
        )}
      </div>
      {error && <div css={styles.error}>{femmesField.meta.error}</div>}
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
  cell2: css({
    textAlign: "center"
  }),
  cellMen: css({
    borderColor: globalStyles.colors.men
  }),
  cellWomen: css({
    borderColor: globalStyles.colors.women
  }),
  error: css({
    display: "flex",
    alignItems: "center",
    height: 18,
    marginTop: 5,
    color: globalStyles.colors.error,
    fontSize: 11,
    borderBottom: `solid ${globalStyles.colors.error} 1px`
  })
};

export default CellInputsMenWomen;
