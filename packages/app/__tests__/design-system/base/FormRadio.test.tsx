import { render } from "@testing-library/react";
import {
  FormRadioGroup,
  FormRadioGroupContent,
  FormRadioGroupInput,
  FormRadioGroupLegend,
  FormRadioGroupValidationMessage,
} from "@/design-system/base/FormRadio";

test("should match snapshot", () => {
  const view = render(
    <FormRadioGroup isValid ariaLabelledby="legendId xxxx">
      <FormRadioGroupLegend id="legendId">Légende</FormRadioGroupLegend>
      <FormRadioGroupContent>
        <FormRadioGroupInput id="inputId1" name="inputName">
          radio 1
        </FormRadioGroupInput>
        <FormRadioGroupInput id="inputId2" name="inputName">
          radio 2
        </FormRadioGroupInput>
        <FormRadioGroupInput id="inputId3" name="inputName">
          radio 3
        </FormRadioGroupInput>
      </FormRadioGroupContent>
      <FormRadioGroupValidationMessage isValid id="xxxx">
        Validé
      </FormRadioGroupValidationMessage>
    </FormRadioGroup>,
  );
  expect(view).toMatchSnapshot();
});
