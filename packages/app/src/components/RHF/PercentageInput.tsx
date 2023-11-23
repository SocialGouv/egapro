import Input from "@codegouvfr/react-dsfr/Input";
import { setValueAsFloatOrEmptyString } from "@common/utils/form";
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

/**
 * PercentageInput is a wrapper around Input to handle percentage input.
 *
 * It stores the data as a number and "" for empty input.
 * It is so because React doesn't advise to use null or undefined for input value.
 *
 * @param param0
 * @returns
 */
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
          defaultValue: "",
          step: 0.1,
          ...register(name, {
            setValueAs: setValueAsFloatOrEmptyString,
            disabled,
          }),
          onBlur: e => {
            // Round number to 1 decimal.
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
              setValue(name, Math.round(value * 10) / 10, { shouldValidate: true });
            }
          },
        }}
        state={errors[name] && "error"}
        stateRelatedMessage={errors[name]?.message}
      />
    </>
  );
};
