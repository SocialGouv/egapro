import { render } from "@testing-library/react";
import { AlertSpinner } from "@components/ds/AlertSpinner";

test("should match snapshot", () => {
  const view = render(<AlertSpinner>Hello</AlertSpinner>);
  expect(view).toMatchSnapshot();
});
