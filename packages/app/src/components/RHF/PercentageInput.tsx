import Input from "@codegouvfr/react-dsfr/Input";
import { type SimpleObject } from "@common/utils/types";
import { type ReactNode } from "react";
import { type Path, useFormContext } from "react-hook-form";

interface Props<FormType> {
  disabled?: boolean;
  label?: ReactNode;
  max?: number;
  min?: number;
  name: Path<FormType>;
}

type FakeFormType = {
  _: number;
};
type FakeKey = keyof FakeFormType;

export const PercentageInput = <FormType extends SimpleObject>({
  label,
  min,
  max,
  name: _name,
  disabled,
}: Props<FormType>) => {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<FakeFormType>();

  const name = _name as FakeKey;

  return (
    <>
      <Input
        label={label}
        iconId="ri-percent-line"
        nativeInputProps={{
          type: "number",
          min,
          max,
          step: 0.1,
          ...register(name, {
            setValueAs: (value: string | null) => {
              // We implement our own valueAsNumber because valueAsNumber returns NaN for empty string and we want null instead for consistency.
              if (value === null) return null;
              const num = Number(value);
              return isNaN(num) || value === "" ? null : num;
            },
            disabled,
          }),
          onBlur: e => {
            // Round number to 1 decimal.
            const num = Number(e.target.value);
            if (!isNaN(num) && e.target.value !== "") {
              setValue(name, Math.round(num * 10) / 10);
            }
          },
        }}
        state={errors[name] && "error"}
        stateRelatedMessage={errors[name]?.message}
      />
    </>
  );
};
