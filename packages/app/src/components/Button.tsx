/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

import ActivityIndicator from "./ActivityIndicator";

interface Props {
  label: string;
  outline?: boolean;
  error?: boolean;
  loading?: boolean;
}

function Button({
  label,
  outline = false,
  error = false,
  loading = false
}: Props) {
  return (
    <div
      css={[
        styles.button,
        outline && styles.buttonOutline,
        error && styles.buttonError
      ]}
    >
      {!outline && !error && <div css={styles.backgroundHover} />}
      <span css={[styles.text, loading && styles.textLoading]}>{label}</span>
      {loading && (
        <div css={styles.loader}>
          <ActivityIndicator />
        </div>
      )}
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
    backgroundColor: globalStyles.colors.primary,
    color: "#FFF",
    WebkitTextFillColor: "#FFF",
    border: `solid ${globalStyles.colors.primary} 1px`,
    borderRadius: 5,
    cursor: "pointer",
    position: "relative",

    ":hover :first-of-type": {
      opacity: 1
    }
  }),
  backgroundHover: css({
    content: '""',
    position: "absolute",
    top: -1, // because border
    left: -1,
    right: -1,
    bottom: -1,
    zIndex: 0,
    background: "linear-gradient(64.86deg, #696CD1 0%, #191A49 100%)",
    borderRadius: 5,

    opacity: 0,
    transition: "opacity 350ms ease-in-out",
    willChange: "opacity"
  }),
  buttonOutline: css({
    color: globalStyles.colors.primary,
    WebkitTextFillColor: globalStyles.colors.primary,
    backgroundColor: "#FFF"
  }),
  buttonError: css({
    color: globalStyles.colors.error,
    WebkitTextFillColor: globalStyles.colors.error,
    borderColor: globalStyles.colors.error,
    backgroundColor: "#FFF"
  }),

  loader: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,

    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }),

  text: css({
    zIndex: 1
  }),
  textLoading: css({
    visibility: "hidden"
  })
};

export default Button;
