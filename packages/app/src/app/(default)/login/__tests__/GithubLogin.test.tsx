import { fireEvent, render, screen } from "@testing-library/react";
import { signIn } from "next-auth/react";

import { GithubLogin } from "../GithubLogin";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("<GithubLogin />", () => {
  const defaultProps = {
    callbackUrl: "/test-callback",
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    // Reset document event listeners
    document.body.innerHTML = "";
  });

  it("should not display the button initially", () => {
    render(<GithubLogin {...defaultProps} />);

    const button = screen.getByRole("button", { name: /staff login/i });
    expect(button).toHaveClass("hidden");
  });

  it("should display the button after correct code input", () => {
    render(<GithubLogin {...defaultProps} />);

    // Simulate typing "staff"
    ["s", "t", "a", "f", "f"].forEach(key => {
      fireEvent.keyPress(document, { key });
    });

    const button = screen.getByRole("button", { name: /staff login/i });
    expect(button).not.toHaveClass("hidden");
  });

  it("should reset code progress on wrong input", () => {
    render(<GithubLogin {...defaultProps} />);

    // Type "sta" correctly
    ["s", "t", "a"].forEach(key => {
      fireEvent.keyPress(document, { key });
    });

    // Type wrong letter
    fireEvent.keyPress(document, { key: "x" });

    // Type "staff" correctly
    ["s", "t", "a", "f", "f"].forEach(key => {
      fireEvent.keyPress(document, { key });
    });

    const button = screen.getByRole("button", { name: /staff login/i });
    expect(button).not.toHaveClass("hidden");
  });

  it("should call signIn with correct parameters when clicked", () => {
    render(<GithubLogin {...defaultProps} />);

    // Type the code
    ["s", "t", "a", "f", "f"].forEach(key => {
      fireEvent.keyPress(document, { key });
    });

    // Click the button
    const button = screen.getByRole("button", { name: /staff login/i });
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledWith("github", {
      callbackUrl: "/test-callback",
    });
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    const { unmount } = render(<GithubLogin {...defaultProps} />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("keypress", expect.any(Function));
  });
});
