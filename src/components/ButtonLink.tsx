/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Link } from "react-router-dom"
import Button from "./Button"

interface Props {
  label: string
  to: string
}

function ButtonLink({ label, to }: Props) {
  return (
    <Link to={to} css={styles.button}>
      <Button label={label} />
    </Link>
  )
}

const styles = {
  button: css({
    display: "inline-flex",
    textDecoration: "none",
  }),
}

export default ButtonLink
