/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { PropsWithChildren } from "react"

export type ActionLinkProps = PropsWithChildren<{
  onClick: () => void
  style?: any
  disabled?: boolean
  title?: string
}>

const ActionLink = ({ children, onClick, style, disabled = false, title = "" }: ActionLinkProps) => {
  return (
    <button type="button" css={[styles.button, style]} onClick={onClick} disabled={disabled} title={title}>
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
