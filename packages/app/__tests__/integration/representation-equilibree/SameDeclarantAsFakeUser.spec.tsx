import { render, screen } from "@testing-library/react";
import { FAKE_USER, useUserMock } from "./mock/user";
import DeclarantPage from "@/pages/representation-equilibree/declarant";

jest.mock("next/router", () => require("next-router-mock"));
jest.mock("@services/apiClient/useUser", () => useUserMock(true));

describe("Déclarant page", () => {
  it(`should render when user is connected`, () => {
    render(<DeclarantPage />);
    expect(screen.getByLabelText(/Email/i)).toHaveValue(FAKE_USER.email);
  });
});
