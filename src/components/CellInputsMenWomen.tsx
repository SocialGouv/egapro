/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";
import { useField } from "react-final-form-hooks";

import globalStyles from "../utils/styles";

import { CellHead, Cell2 } from "./Cell";
import CellInput from "./CellInput";

interface Props {
  form: any;
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
    alignItems: "center",
    marginBottom: 24
  }),
  cellHead: css({
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
