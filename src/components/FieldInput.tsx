/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { useField } from "react-final-form"
import { ValidatorFunction } from "../utils/formHelpers"

import globalStyles from "../utils/globalStyles"

import { CellHead, Cell } from "./Cell"
import CellInput from "./CellInput"
import { IconValid, IconInvalid } from "./ds/Icons"

interface Props {
  fieldName: string
  label: string
  readOnly: boolean
  theme?: "men" | "women"
  validator?: ValidatorFunction
}

function FieldInput({ fieldName, label, readOnly, theme = "women", validator }: Props) {
  const field = useField(fieldName, { validate: validator })
  const error = field.meta.touched && field.meta.error

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

        {readOnly ? <Cell>{field.input.value}</Cell> : <CellInput field={field} theme={theme} />}
      </div>
      {error && <div css={styles.error}>{error}</div>}
    </div>
  )
}

export const HEIGHT = 58
export const MARGIN_TOP = 10

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    height: HEIGHT,
    marginTop: MARGIN_TOP,
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
  }),
  cellHead: css({
    height: 29,
    paddingBottom: 2,
    display: "flex",
    alignItems: "flex-end",
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    fontSize: 14,
  }),
  cellHeadInner: css({
    display: "flex",
    alignItems: "baseline",
  }),
  cellHeadError: css({
    color: globalStyles.colors.error,
    borderColor: "transparent",
  }),
  cellHeadIcon: css({
    marginRight: 5,
  }),
  cellMen: css({
    borderColor: globalStyles.colors.men,
  }),
  cellWomen: css({
    borderColor: globalStyles.colors.women,
  }),
  cellEmpty: css({
    height: 22,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  cellEmptyMen: css({
    color: globalStyles.colors.men,
  }),
  cellEmptyWomen: css({
    color: globalStyles.colors.women,
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
    borderBottom: `solid ${globalStyles.colors.error} 1px`,
  }),
}

export default FieldInput
