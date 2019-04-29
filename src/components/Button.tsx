/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  label: string;
}

function Button({ label }: Props) {
  return <div css={styles.button}>{label}</div>;
}

const styles = {
  button: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    minWidth: 110,
    padding: "0 10px",
    backgroundColor: "#8A92D9",
    color: "#FFF",
    borderRadius: 5,
    cursor: "pointer"
  })
};

export default Button;
