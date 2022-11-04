/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { PropsWithChildren } from "react"

const styles = {
  cell: css({
    width: 62,
    flexShrink: 0,
    marginLeft: 8,
  }),
  cell2: css({
    width: 62 + 8 + 62,
    flexShrink: 0,
    marginLeft: 8,
  }),
  cellHead: css({
    flexGrow: 1,
    marginRight: 2,
  }),
}

export type CellProps = PropsWithChildren<{
  style?: any
}>

export const Cell = ({ style, children }: CellProps) => {
  return <div css={[styles.cell, style]}>{children}</div>
}

export const Cell2 = ({ style, children }: CellProps) => {
  return <div css={[styles.cell2, style]}>{children}</div>
}

export const CellHead = ({ style, children }: CellProps) => {
  return <div css={[styles.cellHead, style]}>{children}</div>
}
