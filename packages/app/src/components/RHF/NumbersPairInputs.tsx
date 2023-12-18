"use client";

import { type FrIconClassName, type RiIconClassName } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { type SimpleObject } from "@common/utils/types";
import { useFormContext } from "react-hook-form";

interface NumbersPairInputsProps<FormType> {
  first: PairInputProps<FormType>;
  options?: {
    disabled?: boolean;
    iconId?: FrIconClassName | RiIconClassName;
    max: number;
    min?: number;
    step?: number;
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
 * Component managed by React Hook Form to handle pair of numbers.
 * One input triggers the computation of the other value.
 */
export const NumberPairInputs = <FormType extends SimpleObject>({
  first: { formKey: firstFormKey, label: firstLabel },
  second: { formKey: secondFormKey, label: secondLabel },
  options = {
    max: 100,
  },
}: NumbersPairInputsProps<FormType>) => {
  const step = options.step ?? 1;

  const {
    setValue,
    getValues,
    register,
    setFocus,
    formState: { errors },
  } = useFormContext<FakeFormType>();

  const syncNumbers = (firstInput: boolean) => {
    const [keyA, keyB] = (firstInput ? [firstFormKey, secondFormKey] : [secondFormKey, firstFormKey]) as FakeSyncMapper;
    const valueA = getValues(keyA);

    if (isNaN(valueA)) return;

    const valueB = options.max - valueA;

    setValue(keyA, valueA, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(keyB, valueB, {
      shouldDirty: true,
      shouldValidate: true,
    });
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
        iconId={options.iconId}
        nativeInputProps={{
          ...register(firstFormKey as FakeKey, {
            onChange() {
              syncNumbers(true);
            },
            disabled: options.disabled === true,
            valueAsNumber: true,
          }),
          type: "number",
          min: options.min,
          max: options.max,
          step,
        }}
      />

      <Input
        label={secondLabel}
        state={errors[secondFormKey as FakeKey] && "error"}
        stateRelatedMessage={errors[secondFormKey as FakeKey]?.message}
        iconId={options.iconId}
        nativeInputProps={{
          ...register(secondFormKey as FakeKey, {
            onChange() {
              syncNumbers(false);
            },
            valueAsNumber: true,
            disabled: options.disabled === true,
          }),
          type: "number",
          min: options.min,
          max: options.max,
          step,
        }}
      />
    </>
  );
};
