import { render } from "@testing-library/react";
import { LinkButton } from "@/components/ds/LinkButton";

test("should match snapshot", () => {
  const view = render(<LinkButton href="/home">Test</LinkButton>);
  expect(view).toMatchSnapshot();
});
