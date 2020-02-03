/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import ButtonSubmit from "./ButtonSubmit";
import { IconWarning } from "./Icons";

interface Props {
  submitFailed: boolean;
  hasValidationErrors: boolean;
  errorMessage?: string;
  loading?: boolean;
  label?: string;
}

function FormSubmit({
  submitFailed,
  hasValidationErrors,
  errorMessage,
  loading = false,
  label = "valider"
}: Props) {
  return (
    <div css={styles.container}>
      <ButtonSubmit
        label={label}
        outline={hasValidationErrors}
        error={submitFailed && hasValidationErrors}
        loading={loading}
      />
      {errorMessage && submitFailed && hasValidationErrors && (
        <div css={styles.error}>
          <div css={styles.icon}>
            <IconWarning width={23} height={20} />
          </div>
          <p>{errorMessage}</p>
        </div>
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
    display: "flex",
    alignItems: "center",
    marginTop: 4,
    padding: "8px 12px",
    backgroundColor: "white",
    border: `solid ${globalStyles.colors.error} 1px`,
    borderRadius: 5,
    color: globalStyles.colors.error,
    fontSize: 12
  }),
  icon: css({
    height: 20,
    marginRight: 10
  })
};

export default FormSubmit;
