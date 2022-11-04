import { render } from "@testing-library/react";
<<<<<<< HEAD
import { Header } from "@/components/ds/Header";
=======
import { Header } from "@components/ds/Header";
>>>>>>> 614a370fd54e75789e0e390e92296f49e9a4eafb

test("should match snapshot", () => {
  const view = render(<Header />);
  expect(view).toMatchSnapshot();
});
