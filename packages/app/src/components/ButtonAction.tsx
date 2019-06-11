/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import Button from "./Button";

interface Props {
  label: string;
  onClick: () => void;
  outline?: boolean;
  error?: boolean;
}

function ButtonAction({
  label,
  onClick,
  outline = false,
  error = false
}: Props) {
  return (
    <button type="button" css={styles.button} onClick={onClick}>
      <Button label={label} outline={outline} error={error} />
    </button>
  );
}

const styles = {
  button: css({
    all: "unset"
  })
};

export default ButtonAction;
