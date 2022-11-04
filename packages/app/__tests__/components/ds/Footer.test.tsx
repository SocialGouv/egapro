import { render } from "@testing-library/react";
<<<<<<< HEAD
import { Footer } from "@/components/ds/Footer";
=======
import { Footer } from "@components/ds/Footer";
>>>>>>> 614a370fd54e75789e0e390e92296f49e9a4eafb

test("should match snapshot", () => {
  const view = render(<Footer />);
  expect(view).toMatchSnapshot();
});
