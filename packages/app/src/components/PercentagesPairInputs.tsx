import { useFormContext } from "react-hook-form";

import { FormGroup, FormGroupLabel, FormGroupMessage } from "../design-system/base/FormGroup";
import { FormInput } from "../design-system/base/FormInput";

type Input = {
  label: string;
  title: string;
};

export const PercentagesPairInputs = ({ firstInput, secondInput }: { firstInput: Input; secondInput: Input }) => {
  const { label: firstLabel, title: firstTitle } = firstInput;
  const { label: secondLabel, title: secondTitle } = secondInput;

  const {
    setValue,
    register,
    formState: { errors },
  } = useFormContext<Record<string, string>>();

  // TODO: unit tests
  const syncPercentages = (event: React.FormEvent<HTMLInputElement>) => {
    const inputChanged = event.currentTarget;
    const inputValueAsNumber = parseFloat(inputChanged.valueAsNumber.toFixed(1));

    if (!isNaN(inputValueAsNumber)) {
      if (inputChanged.id === firstLabel) {
        setValue(firstLabel, String(inputValueAsNumber), { shouldValidate: true });
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(secondLabel, (100 - inputValueAsNumber).toFixed(1), { shouldValidate: true });
        }
      } else if (inputChanged.id === secondLabel) {
        setValue(secondLabel, String(inputValueAsNumber), { shouldValidate: true });
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(firstLabel, (100 - inputValueAsNumber).toFixed(1), { shouldValidate: true });
        }
      }
    }
  };

  return (
    <>
      <FormGroup>
        <FormGroupLabel htmlFor={firstLabel}>{firstTitle}</FormGroupLabel>
        <FormInput
          {...register(firstLabel, {
            onChange: syncPercentages,
          })}
          id={firstLabel}
          type="percentage"
          aria-describedby={errors[firstLabel] && `${firstLabel}-message-error`}
        />
        {errors[firstLabel] && (
          <FormGroupMessage id={`${firstLabel}-message-error`}>{errors[firstLabel]?.message}</FormGroupMessage>
        )}
      </FormGroup>
      <FormGroup>
        <FormGroupLabel htmlFor={secondLabel}>{secondTitle}</FormGroupLabel>
        <FormInput
          {...register(secondLabel, {
            onChange: syncPercentages,
          })}
          id={secondLabel}
          type="percentage"
          aria-describedby={errors[secondLabel] && `${secondLabel}-message-error`}
        />
        {errors[secondLabel] && (
          <FormGroupMessage id={`${secondLabel}-message-error`}>{errors[secondLabel]?.message}</FormGroupMessage>
        )}
      </FormGroup>
    </>
  );
};
