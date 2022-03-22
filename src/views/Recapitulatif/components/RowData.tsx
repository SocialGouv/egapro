/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { ReactNode } from "react"

import globalStyles from "../../../utils/globalStyles"

import { displayFractionPercent } from "../../../utils/helpers"

import { CellHead, Cell } from "../../../components/Cell"

function RowData({
  name,
  data,
  asPercent,
  message,
}: {
  name: string
  data: Array<number | undefined>
  asPercent?: boolean
  message?: string
}) {
  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <CellHead style={styles.cellHead}>{name}</CellHead>

        {data.map((datum, index) => (
          <Cell
            key={index}
            style={[
              styles.cell,
              datum !== undefined && Math.sign(datum) > 0 ? styles.cellMen : styles.cellWomen,
              datum === undefined && styles.cellEmpty,
            ]}
          >
            {datum !== undefined ? (asPercent ? displayFractionPercent(datum, 1) : datum) : "nc"}
          </Cell>
        ))}
      </div>
      <p css={css({ fontSize: "0.8em" })}>{message}</p>
    </div>
  )
}

export function RowDataFull({ name, data, asPercent }: { name: string; data: number | undefined; asPercent: boolean }) {
  return (
    <div css={styles.container}>
      <div css={styles.row}>
        <CellHead style={styles.cellHead}>{name}</CellHead>

        <Cell
          style={[
            styles.cell,
            styles.cellFull,
            data !== undefined && Math.sign(data) > 0 ? styles.cellMen : styles.cellWomen,
            data === undefined && styles.cellEmpty,
          ]}
        >
          {data !== undefined ? (asPercent ? displayFractionPercent(data, 1) : data) : "nc"}
        </Cell>
      </div>
    </div>
  )
}

export function RowLabels({ labels }: { labels: Array<string> }) {
  return (
    <div css={[styles.row, styles.rowLabel]}>
      <CellHead />

      {labels.map((label, index) => (
        <Cell key={index} style={[styles.cell, styles.cellLabel]}>
          {label}
        </Cell>
      ))}
    </div>
  )
}

export function RowLabelFull({ label }: { label: ReactNode }) {
  return (
    <div css={[styles.row, styles.rowLabel]}>
      <CellHead />

      <Cell style={[styles.cell, styles.cellLabel, styles.cellFull]}>{label}</Cell>
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    height: 51,
    marginBottom: 10,
  }),
  row: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
  }),
  rowLabel: css({
    marginBottom: 10,
  }),
  cellHead: css({
    paddingBottom: 2,
    display: "flex",
    alignItems: "flex-end",
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    fontSize: 14,
  }),
  cellHeadInvalid: css({
    color: globalStyles.colors.invalid,
    borderColor: "transparent",
  }),

  cell: css({
    marginLeft: 4,
    width: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  }),
  cellMen: css({
    color: globalStyles.colors.men,
  }),
  cellWomen: css({
    color: globalStyles.colors.women,
  }),
  cellEmpty: css({
    color: globalStyles.colors.invalid,
  }),
  cellLabel: css({
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  }),
  cellFull: css({
    width: 48 * 4 + 3 * 4,
  }),
}

export default RowData
