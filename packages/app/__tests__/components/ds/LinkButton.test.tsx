import { render } from "@testing-library/react";
<<<<<<< HEAD
import { LinkButton } from "@/components/ds/LinkButton";
=======
import { LinkButton } from "@components/ds/LinkButton";
>>>>>>> 614a370fd54e75789e0e390e92296f49e9a4eafb

test("should match snapshot", () => {
  const view = render(<LinkButton href="/home">Test</LinkButton>);
  expect(view).toMatchSnapshot();
});
