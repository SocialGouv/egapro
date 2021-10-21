/** @jsx jsx */
import { css, jsx } from "@emotion/core"

import globalStyles from "../utils/globalStyles"

import ActivityIndicator from "./ActivityIndicator"

interface Props {
  label: string
  outline?: boolean
  error?: boolean
  loading?: boolean
}

function Button({ label, outline = false, error = false, loading = false }: Props) {
  return (
    <div
      css={[
        styles.button,
        outline && styles.buttonOutline,
        error && styles.buttonError,
        !outline && !error && styles.buttonHover,
      ]}
    >
      <span css={[loading && styles.textLoading]}>{label}</span>
      {loading && (
        <div css={styles.loader}>
          <ActivityIndicator />
        </div>
      )}
    </div>
  )
}

export const styles = {
  button: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    minWidth: 110,
    padding: "0 10px",
    backgroundColor: globalStyles.colors.primary,
    color: "#FFF",
    border: `solid ${globalStyles.colors.primary} 1px`,
    borderRadius: 5,
    cursor: "pointer",
    position: "relative",
    background: "linear-gradient(64.86deg, #696CD1 0%, #696CD1 51%, #191A49 100%)",
    backgroundSize: "200%",
    transition: "background-position 350ms ease-in-out",
  }),
  buttonHover: css({
    ":hover": {
      backgroundPosition: "right center",
    },
  }),
  buttonOutline: css({
    color: globalStyles.colors.primary,
    backgroundColor: "#FFF",
    background: "none",
  }),
  buttonError: css({
    color: globalStyles.colors.error,
    borderColor: globalStyles.colors.error,
    backgroundColor: "#FFF",
    background: "none",
  }),

  loader: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),

  textLoading: css({
    visibility: "hidden",
  }),
}

export default Button
