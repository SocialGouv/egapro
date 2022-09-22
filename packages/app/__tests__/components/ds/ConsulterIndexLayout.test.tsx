import { render } from "@testing-library/react";
import { ConsulterIndexLayout } from "@/components/ds/ConsulterIndexLayout";

test("should match snapshot", () => {
  const view = render(<ConsulterIndexLayout>Hello</ConsulterIndexLayout>);
  expect(view).toMatchSnapshot();
});
