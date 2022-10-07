/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"
import { PropsWithChildren } from "react"

const ErrorMessage = ({ children }: PropsWithChildren) => {
  return (
    <div css={styles.errorMessage}>
      <p>{children || "Erreur"}</p>
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
