/** @jsx jsx */
import { css, jsx } from "@emotion/core"

import globalStyles from "../utils/globalStyles"

import ButtonSubmit from "./ButtonSubmit"
import { IconWarning } from "./ds/Icons"

interface Props {
  submitFailed: boolean
  hasValidationErrors: boolean
  errorMessage?: string
  loading?: boolean
  label?: string
}

function FormSubmit({
  submitFailed,
  hasValidationErrors,
  errorMessage,
  loading = false,
  label = "Valider les" + " informations",
}: Props) {
  return (
    <div css={styles.container}>
      <ButtonSubmit label={label} loading={loading} />
      {errorMessage && submitFailed && hasValidationErrors && (
        <div css={styles.error}>
          <div css={styles.icon}>
            <IconWarning boxSize="8" />
          </div>
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  }),
  error: css({
    display: "flex",
    alignItems: "center",
    marginTop: 4,
    padding: "8px 12px",
    backgroundColor: "white",
    border: `solid ${globalStyles.colors.error} 1px`,
    borderRadius: 5,
    color: globalStyles.colors.error,
    fontSize: 12,
  }),
  icon: css({
    height: 20,
    marginRight: 10,
  }),
}

export default FormSubmit
