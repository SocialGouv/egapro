/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  label: string;
}

function ButtonSubmit({ label }: Props) {
  return (
    <button type="submit" css={styles.button}>
      <div css={styles.buttonInner}>{label}</div>
    </button>
  );
}

const styles = {
  button: css({
    all: "unset",
    margin: "24px auto"
  }),
  buttonInner: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    padding: "4px 36px",
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
    cursor: "pointer"
  })
};

export default ButtonSubmit;
