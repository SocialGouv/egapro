/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { PropsWithChildren } from "react"

export type ActionLinkProps = PropsWithChildren<{
  onClick: () => void
  style?: any
}>

const ActionLink = ({ children, onClick, style }: ActionLinkProps) => {
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
