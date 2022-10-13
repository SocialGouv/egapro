import clsx from "clsx";
import { forwardRef } from "react";

export type FormTextareaProps = React.InputHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  isDisabled?: boolean;
  isError?: boolean;
  isValid?: boolean;
};

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ isError, isValid, isDisabled, id, ...rest }, ref) => (
    <textarea
      id={id}
      className={clsx("fr-input", isError && "fr-input--error", isValid && "fr-input--valid")}
      disabled={isDisabled}
      aria-invalid={isError || "false"}
      ref={ref}
      {...rest}
    />
  ),
);

FormTextarea.displayName = "FormTextarea";
