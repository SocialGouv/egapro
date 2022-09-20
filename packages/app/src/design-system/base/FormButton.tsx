import type { FunctionComponent } from "react";
import type { buttonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";

export type FormButtonProps = buttonStylesProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isDisabled?: boolean;
  };

export const FormButton: FunctionComponent<FormButtonProps> = ({
  variant,
  size,
  children,
  iconLeft,
  title,
  iconRight,
  iconOnly,
  isDisabled,
  ...rest
}) => {
  return (
    <button
      className={buttonStyles(variant, size, iconLeft, iconRight, iconOnly)}
      disabled={isDisabled}
      title={title}
      {...rest}
    >
      {children}
    </button>
  );
};
