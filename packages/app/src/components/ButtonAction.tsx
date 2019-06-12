/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import Button from "./Button";

interface Props {
  label: string;
  onClick: () => void;
  outline?: boolean;
  error?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

function ButtonAction({
  label,
  onClick,
  outline = false,
  error = false,
  disabled = false,
  loading = false
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      css={styles.button}
      onClick={onClick}
    >
      <Button label={label} outline={outline} error={error} loading={loading} />
    </button>
  );
}

const styles = {
  button: css({
    all: "unset",

    padding: 0,
    border: "none",
    outline: "none",
    font: "inherit",
    color: "inherit",
    background: "none"
  })
};

export default ButtonAction;
