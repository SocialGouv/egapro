import { render } from "@testing-library/react";
import { SinglePageLayout } from "@/components/ds/SinglePageLayout";

test("should match snapshot", () => {
  const view = render(<SinglePageLayout>Hello</SinglePageLayout>);
  expect(view).toMatchSnapshot();
});
