/** @jsx jsx */
import { css, jsx } from "@emotion/core"

function ErrorMessage(errorMessage: string | undefined) {
  return (
    <div css={styles.errorMessage}>
      <p>{errorMessage || "Erreur"}</p>
    </div>
  )
}

const styles = {
  errorMessage: css({
    margin: "auto",
    alignSelf: "center",
  }),
}

export default ErrorMessage
