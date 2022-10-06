import type { PropsWithChildren } from "react";
import type { buttonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";

export type FormButtonProps = PropsWithChildren<
  buttonStylesProps &
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      isDisabled?: boolean;
    }
>;

export const FormButton = ({
  variant,
  size,
  children,
  iconLeft,
  title,
  iconRight,
  iconOnly,
  isDisabled,
  ...rest
}: FormButtonProps) => {
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
