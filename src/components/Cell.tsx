/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { ReactNode } from "react"

interface Props {
  style?: any
  children?: ReactNode
}

function Cell({ style, children }: Props) {
  return <div css={[styles.cell, style]}>{children}</div>
}

function Cell2({ style, children }: Props) {
  return <div css={[styles.cell2, style]}>{children}</div>
}

function CellHead({ style, children }: Props) {
  return <div css={[styles.cellHead, style]}>{children}</div>
}

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

export { Cell, Cell2, CellHead }
