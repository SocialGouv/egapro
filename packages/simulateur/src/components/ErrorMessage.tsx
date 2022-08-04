/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"

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
