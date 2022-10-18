import { render } from "@testing-library/react";
import { ConsulterIndexLayout } from "@components/layouts/ConsulterIndexLayout";

test("should match snapshot", () => {
  const view = render(<ConsulterIndexLayout>Hello</ConsulterIndexLayout>);
  expect(view).toMatchSnapshot();
});
