import { render } from "@testing-library/react";
import { FormRadioGroup } from "@/design-system/base/FormRadio";

test("should match snapshot", () => {
  const view = render(
    <FormRadioGroup isValid>
      <FormRadioGroup.Legend id="legendId">Légende</FormRadioGroup.Legend>
      <FormRadioGroup.Input id="inputId1" size="sm">
        radio 1
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId2" size="sm">
        radio 2
      </FormRadioGroup.Input>
      <FormRadioGroup.Input id="inputId3" size="sm">
        radio 3
      </FormRadioGroup.Input>
      <FormRadioGroup.ValidationMessage isValid>Validé</FormRadioGroup.ValidationMessage>
    </FormRadioGroup>,
  );
  expect(view).toMatchSnapshot();
});
