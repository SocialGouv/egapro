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
    all: "unset"
  })
};

export default ButtonSubmit;
