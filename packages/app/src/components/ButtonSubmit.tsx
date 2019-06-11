/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import Button from "./Button";

interface Props {
  label: string;
  outline?: boolean;
  error?: boolean;
}

function ButtonSubmit({ label, outline = false, error = false }: Props) {
  return (
    <button type="submit" css={styles.button}>
      <Button label={label} outline={outline} error={error} />
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
