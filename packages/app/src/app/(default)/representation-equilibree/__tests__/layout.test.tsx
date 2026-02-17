import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import RepEqLayout from "../layout";

// Mock the navigation hook used by Breadcrumb
vi.mock("next/navigation", () => ({
  useSelectedLayoutSegment: vi.fn(),
}));

describe("RepEqLayout", () => {
  it("renders children content directly", () => {
    render(
      <RepEqLayout>
        <div data-testid="child-content">Test content</div>
      </RepEqLayout>,
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders breadcrumb component with real navigation", () => {
    render(
      <RepEqLayout>
        <div>Content</div>
      </RepEqLayout>,
    );

    // The breadcrumb should render with real navigation logic
    expect(screen.getByRole("link", { name: "Accueil" })).toBeInTheDocument();
    expect(screen.getByText("Représentation équilibrée")).toBeInTheDocument();
  });

  it("renders multiple children with different types", () => {
    render(
      <RepEqLayout>
        <h1>Title</h1>
        <p>Paragraph</p>
        <button>Button</button>
        <span>Span text</span>
      </RepEqLayout>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Title");
    expect(screen.getByText("Paragraph")).toBeInTheDocument();
    expect(screen.getByText("Button")).toBeInTheDocument();
    expect(screen.getByText("Span text")).toBeInTheDocument();
  });

  it("renders children in correct order", () => {
    render(
      <RepEqLayout>
        <div>First child</div>
        <div>Second child</div>
      </RepEqLayout>,
    );

    const children = screen.getAllByText(/First|Second/);
    expect(children).toHaveLength(2);
    expect(children[0]).toHaveTextContent("First child");
    expect(children[1]).toHaveTextContent("Second child");
  });

  it("renders nested children correctly", () => {
    render(
      <RepEqLayout>
        <div>
          <h2>Nested heading</h2>
          <p>Nested paragraph</p>
        </div>
      </RepEqLayout>,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Nested heading");
    expect(screen.getByText("Nested paragraph")).toBeInTheDocument();
  });
});
