import Input from "@codegouvfr/react-dsfr/Input";
import { truncFloatToOneDecimal } from "@common/utils/number";
import { type SimpleObject } from "@common/utils/types";
import { useFormContext } from "react-hook-form";

interface PercentagesPairInputsProps<FormType> {
  first: PairInputProps<FormType>;
  options?: {
    disabled?: boolean;
  };
  second: PairInputProps<FormType>;
}

interface PairInputProps<FormType> {
  formKey: keyof FormType;
  label: string;
}

// We are sure to manipulate a number form
type FakeFormType = {
  _: number;
};
type FakeKey = keyof FakeFormType;
type FakeSyncMapper = FakeKey[];

/**
 * Component managed by React Hook Form to handle pair of percentages.
 * One input triggers the computation of the other value.
 */
export const PercentagesPairInputs = <FormType extends SimpleObject>({
  first: { formKey: firstFormKey, label: firstLabel },
  second: { formKey: secondFormKey, label: secondLabel },
  options = {},
}: PercentagesPairInputsProps<FormType>) => {
  const {
    setValue,
    getValues,
    register,
    setFocus,
    formState: { errors },
  } = useFormContext<FakeFormType>();

  const syncPercentages = (first: boolean) => {
    const [keyA, keyB] = (first ? [firstFormKey, secondFormKey] : [secondFormKey, firstFormKey]) as FakeSyncMapper;
    const value = truncFloatToOneDecimal(getValues(keyA));

    if (isNaN(value)) return;

    setValue(keyA, value);
    setValue(keyB, truncFloatToOneDecimal(100 - value));
    // Hack to ensure that focus cursor is on the last character. W/o it, if we type "3,2" and remove the last character, the focus is at the start.
    setFocus(keyB);
    setFocus(keyA);
  };

  return (
    <>
      <Input
        label={firstLabel}
        state={errors[firstFormKey as FakeKey] && "error"}
        stateRelatedMessage={errors[firstFormKey as FakeKey]?.message}
        nativeInputProps={{
          ...register(firstFormKey as FakeKey, {
            onChange() {
              syncPercentages(true);
            },
            valueAsNumber: true,
            disabled: options.disabled === true,
          }),
          type: "number",
          min: 0,
          max: 100,
          step: 0.1,
        }}
      />

      <Input
        label={secondLabel}
        state={errors[secondFormKey as FakeKey] && "error"}
        stateRelatedMessage={errors[secondFormKey as FakeKey]?.message}
        nativeInputProps={{
          ...register(secondFormKey as FakeKey, {
            onChange() {
              syncPercentages(false);
            },
            valueAsNumber: true,
            disabled: options.disabled === true,
          }),
          type: "number",
          min: 0,
          max: 100,
          step: 0.1,
        }}
      />
    </>
  );
};
