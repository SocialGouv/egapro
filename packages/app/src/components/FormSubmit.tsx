/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import ButtonSubmit from "../components/ButtonSubmit";

interface Props {
  submitFailed: boolean;
  hasValidationErrors: boolean;
  errorMessage: string;
}

function FormSubmit({
  submitFailed,
  hasValidationErrors,
  errorMessage
}: Props) {
  return (
    <div css={styles.container}>
      <ButtonSubmit
        label="valider"
        outline={hasValidationErrors}
        error={submitFailed && hasValidationErrors}
      />
      {submitFailed && hasValidationErrors && (
        <p css={styles.error}>{errorMessage}</p>
      )}
    </div>
  );
}

const styles = {
  container: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start"
  }),
  error: css({
    marginTop: 4,
    color: globalStyles.colors.error,
    fontSize: 12
  })
};

export default FormSubmit;
