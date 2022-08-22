import { render } from "@testing-library/react";
import { ButtonAction } from "@/components/ds/ButtonAction";

test("should match snapshot", () => {
  const view = render(<ButtonAction label={"action"} />);
  expect(view).toMatchSnapshot();
});
