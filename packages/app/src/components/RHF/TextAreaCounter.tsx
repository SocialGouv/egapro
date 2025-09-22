import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { cx } from "@codegouvfr/react-dsfr/tools/cx";
import * as Sentry from "@sentry/nextjs";
import { useFormContext } from "react-hook-form";

import { sanitizeClipboardText } from "../../utils/errorHandling";

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
    setValue,
    formState: { errors },
  } = useFormContext();

  const value = watch(fieldName);

  const remainingCharacters = maxLength ? maxLength - (value?.length ?? 0) : 0;
  const color =
    remainingCharacters < 0 ? "text-dsfr-error" : remainingCharacters < 20 ? "text-dsfr-warning" : "text-dsfr-neutral";

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    try {
      const rawText = e.clipboardData.getData("text/plain");
      const text = sanitizeClipboardText(rawText);

      if (!text.trim() && rawText.trim()) {
        Sentry.captureMessage("Sanitization removed all content, falling back to default paste", {
          level: "warning",
          tags: {
            component: "TextareaCounter",
            action: "handlePaste",
          },
          extra: {
            fieldName,
            rawText,
          },
        });
        return;
      }

      e.preventDefault();

      const textarea = e.currentTarget;
      const selectionStart = textarea.selectionStart;
      const selectionEnd = textarea.selectionEnd;
      const currentValue = textarea.value;
      const newValue = currentValue.substring(0, selectionStart) + text + currentValue.substring(selectionEnd);

      setValue(fieldName, newValue, { shouldValidate: true });

      setTimeout(() => {
        textarea.selectionStart = selectionStart + text.length;
        textarea.selectionEnd = selectionStart + text.length;
      }, 0);
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: "TextareaCounter",
          action: "handlePaste",
        },
        extra: {
          fieldName,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      console.error("Erreur lors du collage de texte:", error);
    }
  };

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
          onPaste: handlePaste,
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
