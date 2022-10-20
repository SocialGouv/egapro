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
    watch,
    formState: { errors },
  } = useFormContext<Record<string, number>>();

  // TODO: unit tests
  const syncPercentages = (event: React.FormEvent<HTMLInputElement>) => {
    const inputChanged = event.currentTarget;
    const inputValue = inputChanged.valueAsNumber;

    if (!isNaN(inputValue)) {
      if (inputChanged.id === firstLabel) {
        setValue(firstLabel, inputValue, { shouldValidate: true });
        if (inputValue >= 0 && inputValue <= 100) {
          setValue(secondLabel, Number(Number(100 - inputValue).toFixed(1)), { shouldValidate: true });
        }
      } else if (inputChanged.id === secondLabel) {
        setValue(secondLabel, inputValue, { shouldValidate: true });
        if (inputValue >= 0 && inputValue <= 100) {
          setValue(firstLabel, Number(Number(100 - inputValue).toFixed(1)), { shouldValidate: true });
        }
      }
    }
  };

  const firstInputValue = watch(firstInput.label);
  const secondInputValue = watch(secondInput.label);

  return (
    <>
      <FormGroup>
        <FormGroupLabel htmlFor={firstLabel}>{firstTitle}</FormGroupLabel>
        <FormInput
          {...register(firstLabel, {
            onChange: event => {
              syncPercentages(event);
            },
            valueAsNumber: true,
          })}
          id={firstLabel}
          type="percentage"
          aria-describedby={`${firstLabel}-message-error`}
          value={firstInputValue}
        />
        {errors[firstLabel] && (
          <FormGroupMessage id={`${firstLabel}-message-error`}>{errors[firstLabel]?.message}</FormGroupMessage>
        )}
      </FormGroup>
      <FormGroup>
        <FormGroupLabel htmlFor={secondLabel}>{secondTitle}</FormGroupLabel>
        <FormInput
          {...register(secondLabel, {
            onChange: event => {
              syncPercentages(event);
            },
            valueAsNumber: true,
          })}
          id={secondLabel}
          type="percentage"
          aria-describedby={`${secondLabel}-message-error`}
          value={secondInputValue}
        />
        {errors[secondLabel] && (
          <FormGroupMessage id={`${secondLabel}-message-error`}>{errors[secondLabel]?.message}</FormGroupMessage>
        )}
      </FormGroup>
    </>
  );
};
