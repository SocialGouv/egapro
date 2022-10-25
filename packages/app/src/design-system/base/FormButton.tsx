import type { ButtonStylesProps } from "../utils/button-styles";
import { buttonStyles } from "../utils/button-styles";

export type FormButtonProps = ButtonStylesProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isDisabled?: boolean;
  };

// NB: by default, a HTML button will submit a form. To not submit it, use type="button"
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
      className={buttonStyles({ variant, size, iconLeft, iconRight, iconOnly })}
      disabled={isDisabled}
      title={title}
      {...rest}
    >
      {children}
    </button>
  );
};
