import { render } from "@testing-library/react";
import { Callout } from "@/design-system/base/Callout";

test("should match snapshot", () => {
  const mockClick = jest.fn();
  const view = render(
    <Callout title={"Titre mise en avant"} buttonLabel={"Cliquer là"} buttonOnClick={mockClick}>
      Test de mise en avant
    </Callout>,
  );
  expect(view).toMatchSnapshot();
});
