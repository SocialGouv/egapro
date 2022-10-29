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
  } = useFormContext<Record<string, string>>();

  // TODO: unit tests
  const syncPercentages = (event: React.FormEvent<HTMLInputElement>) => {
    const inputChanged = event.currentTarget;
    const inputValueAsNumber = inputChanged.valueAsNumber;
    const inputValue = inputChanged.value;

    if (!isNaN(inputValueAsNumber)) {
      if (inputChanged.id === firstLabel) {
        setValue(firstLabel, inputValue, { shouldValidate: true });
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(secondLabel, Number(100 - inputValueAsNumber).toFixed(1), { shouldValidate: true });
        }
      } else if (inputChanged.id === secondLabel) {
        setValue(secondLabel, inputValue, { shouldValidate: true });
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(firstLabel, Number(100 - inputValueAsNumber).toFixed(1), { shouldValidate: true });
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
          })}
          id={firstLabel}
          type="percentage"
          aria-describedby={`${firstLabel}-message-error`}
          value={isNaN(parseFloat(firstInputValue)) ? "" : firstInputValue}
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
          })}
          id={secondLabel}
          type="percentage"
          aria-describedby={`${secondLabel}-message-error`}
          value={isNaN(parseFloat(secondInputValue)) ? "" : secondInputValue}
        />
        {errors[secondLabel] && (
          <FormGroupMessage id={`${secondLabel}-message-error`}>{errors[secondLabel]?.message}</FormGroupMessage>
        )}
      </FormGroup>
    </>
  );
};
