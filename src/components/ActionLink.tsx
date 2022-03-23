/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { ReactNode } from "react"

interface Props {
  children: ReactNode
  onClick: () => void
  style?: any
}

function ActionLink({ children, onClick, style }: Props) {
  return (
    <button type="button" css={[styles.button, style]} onClick={onClick}>
      {children}
    </button>
  )
}

const styles = {
  button: css({
    padding: 0,
    border: "none",
    background: "none",

    cursor: "pointer",
    fontSize: 14,
    textAlign: "center",
    textDecoration: "underline",
  }),
}

export default ActionLink
