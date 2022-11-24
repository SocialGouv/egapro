import { formatPrettyFloat, truncFloatToOneDecimal } from "@common/utils/number";
import { useFormContext } from "react-hook-form";

import { FormGroup, FormGroupLabel, FormGroupMessage } from "../design-system/base/FormGroup";
import { FormInput } from "../design-system/base/FormInput";

type Input = {
  label: string;
  title: string;
};

/**
 * Component managed by React Hook Form to handle pair of percentages.
 * One input triggers the computation of the other value.
 */
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
    const inputValueAsNumber = truncFloatToOneDecimal(inputChanged.valueAsNumber);

    if (!isNaN(inputValueAsNumber)) {
      if (inputChanged.id === firstLabel) {
        setValue(firstLabel, String(inputValueAsNumber));
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(secondLabel, formatPrettyFloat(100 - inputValueAsNumber));
        }
        // Hack to ensure that focus cursor is on the last character. W/o it, if we type "3,2" and remove the last character, the focus is at the start.
        setFocus(secondLabel);
        setFocus(firstLabel);
      } else if (inputChanged.id === secondLabel) {
        setValue(secondLabel, String(inputValueAsNumber));
        if (inputValueAsNumber >= 0 && inputValueAsNumber <= 100) {
          setValue(firstLabel, formatPrettyFloat(100 - inputValueAsNumber));
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
