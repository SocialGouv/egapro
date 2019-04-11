/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";

import { TranchesAges } from "../globals.d";
import { stateFieldType } from "../hooks/useField";

import { displayNameTranchesAges } from "../utils/helpers";
import FieldGroup from "./FieldGroup";

interface Props {
  trancheAge: TranchesAges;
  calculable: boolean;
  femmesField: stateFieldType;
  hommesField: stateFieldType;
}

function RowTrancheAge({
  trancheAge,
  calculable,
  femmesField,
  hommesField
}: Props) {
  return (
    <div css={styles.row}>
      <div css={styles.cellHead}>{displayNameTranchesAges(trancheAge)}</div>

      {calculable ? (
        <React.Fragment>
          <div css={styles.cell}>
            <FieldGroup field={femmesField} />
          </div>

          <div css={styles.cell}>
            <FieldGroup field={hommesField} />
          </div>
        </React.Fragment>
      ) : (
        <div css={styles.cell2}>Non Calculable</div>
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
    flexGrow: 1,
    flexBasis: "0%",
    textAlign: "right"
  }),
  cell: css({
    flexGrow: 2,
    flexBasis: "0%",
    marginLeft: 24
  }),
  cell2: css({
    flexGrow: 4,
    flexBasis: "0%",
    marginLeft: 24,
    marginRight: 24,
    textAlign: "center"
  })
};

export default RowTrancheAge;
