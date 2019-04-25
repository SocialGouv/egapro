/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import React from "react";
import { useField } from "react-final-form-hooks";

import FieldGroup from "./FieldGroup";

interface Props {
  form: any;
  name: string;
  calculable: boolean;
  femmeFieldName: string;
  hommeFieldName: string;
}

function RowFemmesHommes({
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
      <div css={styles.cellHead}>{name}</div>

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

export default RowFemmesHommes;
