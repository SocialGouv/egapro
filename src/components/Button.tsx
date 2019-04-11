/** @jsx jsx */
import { css, jsx } from "@emotion/core";

interface Props {
  label: string;
  onClick?: () => void;
}

function Button({ label, onClick }: Props) {
  return (
    <div css={styles.button} onClick={onClick}>
      {label}
    </div>
  );
}

const styles = {
  button: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    padding: "4px 36px",
    margin: "24px auto",
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)",
    cursor: "pointer"
  })
};

export default Button;
