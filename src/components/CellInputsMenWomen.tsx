/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";
import { useField } from "react-final-form-hooks";
import { FormApi } from "final-form";

import globalStyles from "../utils/globalStyles";

import { CellHead, Cell2 } from "./Cell";
import CellInput from "./CellInput";

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
  const femmesField = useField(femmeFieldName, form);
  const hommesField = useField(hommeFieldName, form);
  return (
    <div css={styles.row}>
      <CellHead style={styles.cellHead}>{name}</CellHead>

      {calculable ? (
        <React.Fragment>
          <CellInput field={hommesField} style={styles.cellMen} />

          <CellInput field={femmesField} style={styles.cellWomen} />
        </React.Fragment>
      ) : (
        <Cell2 css={styles.cell2}>Non Calculable</Cell2>
      )}
    </div>
  );
}

const styles = {
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    height: 51,
    marginBottom: 10
  }),
  cellHead: css({
    height: 22,
    display: "flex",
    alignItems: "center",
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    fontSize: 14
  }),
  cell2: css({
    textAlign: "center"
  }),
  cellMen: css({
    borderColor: globalStyles.colors.men
  }),
  cellWomen: css({
    borderColor: globalStyles.colors.women
  })
};

export default CellInputsMenWomen;
