/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import { TranchesAges } from "../globals.d";
import { stateFieldType } from "../hooks/useField";

import { displayNameTranchesAges } from "../utils/helpers";
import FieldGroup from "./FieldGroup";

interface Props {
  trancheAge: TranchesAges;
  nbSalarieFemmeField: stateFieldType;
  nbSalarieHommeField: stateFieldType;
}

function RowTrancheAge({
  trancheAge,
  nbSalarieFemmeField,
  nbSalarieHommeField
}: Props) {
  return (
    <div css={styles.row}>
      <div css={styles.cellHead}>{displayNameTranchesAges(trancheAge)}</div>

      <div css={styles.cell}>
        <FieldGroup field={nbSalarieFemmeField} />
      </div>

      <div css={styles.cell}>
        <FieldGroup field={nbSalarieHommeField} />
      </div>
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
  })
};

export default RowTrancheAge;
