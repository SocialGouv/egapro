/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import Button from "./Button";

interface Props {
  label: string;
  outline?: boolean;
  error?: boolean;
  loading?: boolean;
}

function ButtonSubmit({
  label,
  outline = false,
  error = false,
  loading = false
}: Props) {
  return (
    <button type="submit" css={styles.button} disabled={loading}>
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

export default ButtonSubmit;
