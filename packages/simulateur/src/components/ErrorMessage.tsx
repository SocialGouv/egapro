/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react"

const ErrorMessage: React.FC = ({ children }) => {
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
