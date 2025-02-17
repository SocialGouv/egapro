import { render, screen } from "@testing-library/react";
import { useSelectedLayoutSegment, useSelectedLayoutSegments } from "next/navigation";
import { useSession } from "next-auth/react";

import { Navigation } from "../Navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSelectedLayoutSegment: jest.fn(),
  useSelectedLayoutSegments: jest.fn(),
}));

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

interface MenuItem {
  linkProps?: {
    href: string;
  };
  menuLinks?: Array<{
    linkProps: {
      href: string;
    };
    text: string;
  }>;
  text: string;
}

// Mock MainNavigation from react-dsfr
jest.mock("@codegouvfr/react-dsfr/MainNavigation", () => ({
  MainNavigation: ({ items }: { items: MenuItem[] }) => (
    <nav>
      {items.map((item, index) => (
        <div key={index} data-testid="nav-item">
          <span>{item.text}</span>
          {item.menuLinks?.map((link, linkIndex) => (
            <a
              key={linkIndex}
              href={link.linkProps.href}
              data-testid={`menu-link-${link.text.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {link.text}
            </a>
          ))}
        </div>
      ))}
    </nav>
  ),
}));

// Mock admin menu items
jest.mock("../../admin/Navigation", () => ({
  adminMenuItems: [
    { text: "Admin Item 1", href: "/admin/1" },
    { text: "Admin Item 2", href: "/admin/2" },
  ],
}));

describe("<Navigation />", () => {
  const mockUseSession = useSession as jest.Mock;
  const mockUseSelectedLayoutSegment = useSelectedLayoutSegment as jest.Mock;
  const mockUseSelectedLayoutSegments = useSelectedLayoutSegments as jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockUseSession.mockReturnValue({ data: { user: { staff: false }, staff: { impersonating: false } } });
    mockUseSelectedLayoutSegment.mockReturnValue(null);
    mockUseSelectedLayoutSegments.mockReturnValue([]);
  });

  it("should render all main navigation items", () => {
    render(<Navigation />);

    const navItems = screen.getAllByTestId("nav-item");
    expect(navItems).toHaveLength(3); // Accueil, Index, Représentation équilibrée

    expect(screen.getByText("Accueil")).toBeInTheDocument();
    expect(screen.getByText("Index")).toBeInTheDocument();
    expect(screen.getByText("Représentation équilibrée")).toBeInTheDocument();
  });

  it("should render admin menu when user is staff", () => {
    mockUseSession.mockReturnValue({ data: { user: { staff: true }, staff: { impersonating: false } } });
    render(<Navigation />);

    const navItems = screen.getAllByTestId("nav-item");
    expect(navItems).toHaveLength(4); // Including Admin menu
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("should render admin menu when user is impersonating", () => {
    mockUseSession.mockReturnValue({ data: { user: { staff: false }, staff: { impersonating: true } } });
    render(<Navigation />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("should render index submenu with correct links", () => {
    render(<Navigation />);

    expect(screen.getByTestId("menu-link-à-propos-de-l'index")).toHaveAttribute("href", "/index-egapro");
    expect(screen.getByTestId("menu-link-calculer-mon-index")).toHaveAttribute(
      "href",
      "/index-egapro/simulateur/commencer",
    );
    expect(screen.getByTestId("menu-link-déclarer-mon-index")).toHaveAttribute(
      "href",
      "/index-egapro/declaration/assujetti",
    );
    expect(screen.getByTestId("menu-link-consulter-l'index")).toHaveAttribute("href", "/index-egapro/recherche");
  });

  it("should render representation equilibree submenu with correct links", () => {
    render(<Navigation />);

    expect(screen.getByTestId("menu-link-à-propos-des-écarts")).toHaveAttribute("href", "/representation-equilibree");
    expect(screen.getByTestId("menu-link-déclarer-les-écarts")).toHaveAttribute(
      "href",
      "/representation-equilibree/assujetti",
    );
    expect(screen.getByTestId("menu-link-consulter-les-écarts")).toHaveAttribute(
      "href",
      "/representation-equilibree/recherche",
    );
  });
});
