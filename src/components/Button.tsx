/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

interface Props {
  label: string;
  outline?: boolean;
  error?: boolean;
}

function Button({ label, outline = false, error = false }: Props) {
  return (
    <div
      css={[
        styles.button,
        outline && styles.buttonOutline,
        error && styles.buttonError
      ]}
    >
      {label}
    </div>
  );
}

const styles = {
  button: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    minWidth: 110,
    padding: "0 10px",
    backgroundColor: globalStyles.colors.women,
    color: "#FFF",
    border: `solid ${globalStyles.colors.women} 1px`,
    borderRadius: 5,
    cursor: "pointer"
  }),
  buttonOutline: css({
    color: globalStyles.colors.women,
    backgroundColor: "#FFF"
  }),
  buttonError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error,
    backgroundColor: "#FFF"
  })
};

export default Button;
