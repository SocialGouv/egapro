/** @jsx jsx */
import { css, jsx } from "@emotion/react"
import { Link, LinkProps } from "react-router-dom"

interface Props {
  label: string
  to: LinkProps["to"]
}

function TextLink({ label, to }: Props) {
  return (
    <Link to={to} css={styles.link}>
      {label}
    </Link>
  )
}

const styles = {
  link: css({
    color: "currentColor",
    textDecoration: "underline",
  }),
}

export default TextLink
