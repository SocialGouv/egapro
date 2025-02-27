import { render, screen } from "@testing-library/react";

import InformationsEntreprise from "../page";

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

// Mock the zustand store
jest.mock("../../useRepeqFunnelStore", () => ({
  useRepeqFunnelStore: jest.fn(() => ({
    funnel: {
      siren: "123456789",
      year: 2023,
    },
  })),
  useRepeqFunnelStoreHasHydrated: jest.fn(() => true),
}));

// Mock the getCompany function
jest.mock("@globalActions/company", () => ({
  getCompany: jest.fn().mockResolvedValue({
    ok: true,
    data: {
      siren: "123456789",
      simpleLabel: "Test Company",
      activitePrincipaleUniteLegale: "62.01Z",
      firstMatchingEtablissement: {
        libelleCommuneEtablissement: "Paris",
      },
    },
  }),
}));

// Mock the skeleton components
jest.mock("@components/utils/skeleton/SkeletonFlex", () => ({
  SkeletonFlex: () => <div>Loading...</div>,
}));

jest.mock("@design-system/utils/client/skeleton", () => ({
  Skeleton: () => <div>Loading...</div>,
}));

describe("InformationsEntreprise", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", () => {
    render(<InformationsEntreprise />);

    // Check that the component renders without errors
    const loadingElements = screen.getAllByText("Loading...");
    expect(loadingElements.length).toBeGreaterThan(0);
  });
});
