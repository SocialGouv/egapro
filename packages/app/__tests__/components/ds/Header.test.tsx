import { render } from "@testing-library/react";
import { Header } from "@/components/ds/Header";

test("should match snapshot", () => {
  const view = render(<Header />);
  expect(view).toMatchSnapshot();
});
