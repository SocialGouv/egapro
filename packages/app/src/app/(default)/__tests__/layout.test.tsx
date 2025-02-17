import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";

import DefaultLayout from "../layout";

// Mock the imported components
jest.mock("../../Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

jest.mock("../../Header", () => ({
  Header: ({ auth, navigation }: { auth: boolean; navigation: ReactNode }) => (
    <header data-testid="header">
      Header
      {auth && <div data-testid="auth">Auth enabled</div>}
      {navigation}
    </header>
  ),
}));

jest.mock("../Navigation", () => ({
  Navigation: () => <nav data-testid="navigation">Navigation</nav>,
}));

// Mock the CSS module
jest.mock("../default.module.css", () => ({
  app: "app-class",
  content: "content-class",
}));

describe("<DefaultLayout />", () => {
  it("should render the complete layout structure", async () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;
    render(await DefaultLayout({ children: <TestChild /> }));

    // Check main structure elements
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("should render the navigation component in header", async () => {
    render(await DefaultLayout({ children: null }));

    expect(screen.getByTestId("navigation")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toContainElement(screen.getByTestId("navigation"));
  });

  it("should render children in main content area", async () => {
    const TestChild = () => <div data-testid="test-child">Test Content</div>;
    render(await DefaultLayout({ children: <TestChild /> }));

    const main = screen.getByRole("main");
    expect(main).toContainElement(screen.getByTestId("test-child"));
  });

  it("should apply correct CSS classes", async () => {
    render(await DefaultLayout({ children: null }));

    expect(screen.getByTestId("header").parentElement).toHaveClass("app-class");
    expect(screen.getByRole("main")).toHaveClass("content-class");
  });

  it("should enable auth in header", async () => {
    render(await DefaultLayout({ children: null }));

    expect(screen.getByTestId("auth")).toBeInTheDocument();
  });
});
