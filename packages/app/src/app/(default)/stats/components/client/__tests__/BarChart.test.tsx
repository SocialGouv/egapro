import { render, screen } from "@testing-library/react";

import { BarChart } from "../BarChart";

// Mock Chart.js
jest.mock("react-chartjs-2", () => ({
  Bar: jest.fn(({ options, data, ...props }) => {
    const { plugins } = options || {};
    // Check if datalabels plugin is enabled via options.plugins.datalabels.display
    const hasDataLabelsPlugin =
      options?.plugins?.datalabels?.display === "auto" || options?.plugins?.datalabels?.display === true;

    return (
      <div data-testid="chart-canvas-container" {...props}>
        <canvas data-testid="chart-canvas" />
        {/* Simulate data labels for accessibility testing */}
        {hasDataLabelsPlugin &&
          data?.datasets?.map(
            (dataset: { data?: number[]; label?: string }, datasetIndex: number) =>
              dataset.data?.map((value: number, index: number) => (
                <span
                  key={`${datasetIndex}-${index}`}
                  data-testid={`data-label-${datasetIndex}-${index}`}
                  aria-label={`${dataset.label || "Série"} ${index + 1}: ${value}`}
                >
                  {value}
                </span>
              )),
          )}
      </div>
    );
  }),
}));

jest.mock("chartjs-plugin-datalabels", () => ({
  __esModule: true,
  default: {
    id: "datalabels",
  },
}));

describe("BarChart Accessibility", () => {
  const mockData = [
    { legend: "Entreprise A", value: 85 },
    { legend: "Entreprise B", value: 92 },
    { legend: "Entreprise C", value: 78 },
  ];

  const mockProps = {
    data: mockData,
    tooltipLegend: "Index égalité professionnelle",
    ariaLabel: "Graphique en barres - Index égalité professionnelle",
    ariaDescribedBy: "chart-description",
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("Alternative textuelle", () => {
    it("devrait avoir un attribut aria-label descriptif", () => {
      render(<BarChart {...mockProps} />);

      const chart = screen.getByRole("img");
      expect(chart).toHaveAttribute("aria-label");

      const ariaLabel = chart.getAttribute("aria-label");
      expect(ariaLabel).toContain("Graphique");
      expect(ariaLabel).toContain("Index égalité professionnelle");
    });

    it("devrait avoir un rôle img pour les lecteurs d'écran", () => {
      render(<BarChart {...mockProps} />);

      const chart = screen.getByRole("img");
      expect(chart).toBeInTheDocument();
    });

    it("devrait référencer une description détaillée via aria-describedby", () => {
      render(<BarChart {...mockProps} />);

      const chart = screen.getByRole("img");
      expect(chart).toHaveAttribute("aria-describedby", "chart-description");
    });
  });

  describe("Description détaillée", () => {
    it("devrait pouvoir être associée à une description externe", () => {
      // Créer un élément de description dans le DOM
      const descriptionElement = document.createElement("div");
      descriptionElement.id = "chart-description";
      descriptionElement.className = "sr-only";
      descriptionElement.textContent =
        "Graphique représentant l'index égalité professionnelle pour 3 entreprises: Entreprise A (85 points), Entreprise B (92 points), Entreprise C (78 points). Valeur minimum: 78, valeur maximum: 92.";
      document.body.appendChild(descriptionElement);

      render(<BarChart {...mockProps} />);

      const chart = screen.getByRole("img");
      expect(chart).toHaveAttribute("aria-describedby", "chart-description");

      const description = document.getElementById("chart-description");
      expect(description).toBeInTheDocument();
      expect(description?.textContent).toContain("index égalité professionnelle");
      expect(description?.textContent).toContain("Entreprise A");
      expect(description?.textContent).toContain("85");

      // Nettoyer
      document.body.removeChild(descriptionElement);
    });
  });

  describe("Étiquettes de données", () => {
    it("devrait afficher les valeurs directement sur le graphique quand showValue est activé", () => {
      render(<BarChart {...mockProps} showValue={true} />);

      // Vérifier que les data labels sont présents
      expect(screen.getByTestId("data-label-0-0")).toBeInTheDocument();
      expect(screen.getByTestId("data-label-0-1")).toBeInTheDocument();
      expect(screen.getByTestId("data-label-0-2")).toBeInTheDocument();
    });

    it("devrait avoir des étiquettes accessibles pour chaque point de données", () => {
      render(<BarChart {...mockProps} showValue={true} />);

      const dataLabel1 = screen.getByTestId("data-label-0-0");
      const dataLabel2 = screen.getByTestId("data-label-0-1");
      const dataLabel3 = screen.getByTestId("data-label-0-2");

      expect(dataLabel1).toHaveAttribute("aria-label", "Index égalité professionnelle 1: 85");
      expect(dataLabel2).toHaveAttribute("aria-label", "Index égalité professionnelle 2: 92");
      expect(dataLabel3).toHaveAttribute("aria-label", "Index égalité professionnelle 3: 78");
    });
  });

  describe("Thèmes et couleurs", () => {
    it("devrait supporter le thème multicolor", () => {
      render(<BarChart {...mockProps} theme="multicolor" />);

      const chart = screen.getByRole("img");
      expect(chart).toBeInTheDocument();
    });

    it("devrait supporter le thème monochrome par défaut", () => {
      render(<BarChart {...mockProps} theme="monochrome" />);

      const chart = screen.getByRole("img");
      expect(chart).toBeInTheDocument();
    });
  });

  describe("Gestion des données vides", () => {
    const emptyData: Array<{ legend: number | string; value: number }> = [];

    it("devrait gérer gracieusement les données vides", () => {
      render(<BarChart data={emptyData} tooltipLegend="Test" ariaLabel="Graphique vide - Aucune donnée disponible" />);

      const chart = screen.getByRole("img");
      expect(chart).toBeInTheDocument();

      const ariaLabel = chart.getAttribute("aria-label");
      expect(ariaLabel).toContain("Aucune donnée");
    });
  });

  describe("Accessibilité générale", () => {
    it("devrait avoir une structure accessible", () => {
      render(<BarChart {...mockProps} />);

      const chart = screen.getByRole("img");
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute("aria-label");
      expect(chart).toHaveAttribute("aria-describedby");
    });

    it("devrait fonctionner sans aria-describedby optionnel", () => {
      const propsWithoutDescribedBy = {
        data: mockData,
        tooltipLegend: "Index égalité professionnelle",
        ariaLabel: "Graphique en barres - Index égalité professionnelle",
      };

      render(<BarChart {...propsWithoutDescribedBy} />);

      const chart = screen.getByRole("img");
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveAttribute("aria-label");
      expect(chart).not.toHaveAttribute("aria-describedby");
    });
  });
});
