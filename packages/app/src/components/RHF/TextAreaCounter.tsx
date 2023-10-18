import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import { useFormContext } from "react-hook-form";

export type TextareaCounterProps = {
  disabled?: boolean;
  fieldName: string;
  hasError?: boolean;
  label: string;
  max?: number;
  maxLength?: number;
  min?: number;
  placeholder?: string;
  readOnly?: boolean;
  showError?: boolean;
  showRemainingCharacters?: boolean;
};

export const TextareaCounter = ({
  label,
  placeholder,
  fieldName,
  maxLength = 300,
  readOnly,
  disabled,
  showRemainingCharacters = false,
}: TextareaCounterProps) => {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const value = watch(fieldName);

  const remainingCharacters = maxLength ? maxLength - (value?.length ?? 0) : 0;
  const color =
    remainingCharacters < 0 ? "text-dsfr-error" : remainingCharacters < 20 ? "text-dsfr-warning" : "text-dsfr-neutral";

  return (
    <>
      <Input
        textArea
        nativeTextAreaProps={{
          ...register(fieldName),
          placeholder: placeholder,
          readOnly,
          disabled,
          maxLength,
        }}
        label={label}
        id={fieldName}
        {...(maxLength && { maxLength })}
        state={errors[fieldName] && "error"}
        stateRelatedMessage={errors[fieldName]?.message as string}
      />

      {showRemainingCharacters && maxLength && (
        <p className={cx(fr.cx("fr-text--sm", "fr-mt-n3v"), color)}>
          {remainingCharacters} caractère{remainingCharacters > 1 && "s"} restant
          {remainingCharacters > 1 && "s"}
        </p>
      )}
    </>
  );
};
