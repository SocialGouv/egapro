import { render } from "@testing-library/react";
<<<<<<< HEAD
import { Logo } from "@/components/ds/Logo";
=======
import { Logo } from "@components/ds/Logo";
>>>>>>> 614a370fd54e75789e0e390e92296f49e9a4eafb

test("should match snapshot", () => {
  const view = render(<Logo />);
  expect(view).toMatchSnapshot();
});
