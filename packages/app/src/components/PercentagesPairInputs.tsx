import { useFormContext } from "react-hook-form";

import { FormGroup, FormGroupLabel, FormGroupMessage } from "../design-system/base/FormGroup";
import { FormInput } from "../design-system/base/FormInput";

type Input = {
  label: string;
  title: string;
};

export const PercentagesPairInputs = ({ input1, input2 }: { input1: Input; input2: Input }) => {
  const { label: label1, title: title1 } = input1;
  const { label: label2, title: title2 } = input2;

  const {
    setValue,
    register,
    formState: { errors },
  } = useFormContext<Record<string, number>>();

  // TODO: unit tests
  const syncPercentages = (event: React.FormEvent<HTMLInputElement>) => {
    const inputChanged = event.currentTarget;
    const inputValue = inputChanged.valueAsNumber;

    if (!isNaN(inputValue)) {
      if (inputChanged.id === label1) {
        setValue(label1, inputValue, { shouldValidate: true });
        if (inputValue >= 0 && inputValue <= 100) {
          setValue(label2, 100 - inputValue, { shouldValidate: true });
        }
      } else if (inputChanged.id === label2) {
        setValue(label2, inputValue, { shouldValidate: true });
        if (inputValue >= 0 && inputValue <= 100) {
          setValue(label1, 100 - inputValue, { shouldValidate: true });
        }
      }
    }
  };

  return (
    <>
      <FormGroup>
        <FormGroupLabel htmlFor={label1}>{title1}</FormGroupLabel>
        <FormInput
          {...register(label1, {
            onChange: event => {
              syncPercentages(event);
            },
            valueAsNumber: true,
          })}
          id={label1}
          type="number"
          min="0"
          max="100"
          aria-describedby={`${label1}-message-error`}
        />
        {errors[label1] && (
          <FormGroupMessage id={`${label1}-message-error`}>{errors[label1]?.message}</FormGroupMessage>
        )}
      </FormGroup>
      <FormGroup>
        <FormGroupLabel htmlFor={label2}>{title2}</FormGroupLabel>
        <FormInput
          {...register(label2, {
            onChange: event => {
              syncPercentages(event);
            },
            valueAsNumber: true,
          })}
          id={label2}
          type="number"
          min="0"
          max="100"
          aria-describedby={`${label2}-message-error`}
        />
        {errors[label2] && (
          <FormGroupMessage id={`${label2}-message-error`}>{errors[label2]?.message}</FormGroupMessage>
        )}
      </FormGroup>
    </>
  );
};
