import { render, screen } from "@testing-library/react";
import { FAKE_USER } from "./mock/user";
import DeclarantPage from "@/pages/ecart-rep/declarant";

test(`"Déclarant" page should render when user is connected`, () => {
  render(<DeclarantPage />);
  expect(screen.getByLabelText(/Email/i)).toHaveValue(FAKE_USER.email);
});
