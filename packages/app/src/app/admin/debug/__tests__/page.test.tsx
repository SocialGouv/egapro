import { render, screen } from "@testing-library/react";

import DebugPage from "../page";

// Mock the getServerSession function
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: {
      staff: true,
      email: "test@example.com",
    },
  }),
}));

// Mock the notFound function
jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

describe("<DebugPage />", () => {
  it("should render the debug page", async () => {
    render(await DebugPage());

    const heading = screen.getByText("Admin Debug");
    expect(heading).toBeInTheDocument();

    const toggleText = screen.getByText("Activer bouton de debug ?");
    expect(toggleText).toBeInTheDocument();

    const sessionHeading = screen.getByText("Session Content");
    expect(sessionHeading).toBeInTheDocument();

    const configHeading = screen.getByText("Server Side Config");
    expect(configHeading).toBeInTheDocument();
  });
});
