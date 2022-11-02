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
    setFocus,
    formState: { errors },
  } = useFormContext<Record<string, string>>();

  // TODO: unit tests
  const syncPercentages = (event: React.FormEvent<HTMLInputElement>) => {
    const inputChanged = event.currentTarget;
    const inputValueAsNumber = parseFloat(inputChanged.valueAsNumber.toFixed(1));

    if (!isNaN(inputValueAsNumber)) {
      if (inputChanged.id === firstLabel) {
        setValue(firstLabel, String(inputValueAsNumber));
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(secondLabel, (100 - inputValueAsNumber).toFixed(1));
        }
        // Hack to ensure that focus cursor is on the last character. W/o it, if we type "3,2" and remove the last chararcter, the focuse is at start.
        setFocus(secondLabel);
        setFocus(firstLabel);
      } else if (inputChanged.id === secondLabel) {
        setValue(secondLabel, String(inputValueAsNumber));
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(firstLabel, (100 - inputValueAsNumber).toFixed(1));
        }
        // Hack to ensure that focus cursor is on the last character.
        setFocus(firstLabel);
        setFocus(secondLabel);
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
          aria-describedby={`${firstLabel}-message-error`}
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
          aria-describedby={`${secondLabel}-message-error`}
        />
        {errors[secondLabel] && (
          <FormGroupMessage id={`${secondLabel}-message-error`}>{errors[secondLabel]?.message}</FormGroupMessage>
        )}
      </FormGroup>
    </>
  );
};
