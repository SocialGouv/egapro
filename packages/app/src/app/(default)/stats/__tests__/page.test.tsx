import { render, screen } from "@testing-library/react";

import { getPublicStats } from "../actions";
import { StatsContent } from "../content";

// Mock des actions
jest.mock("../actions", () => ({
  getPublicStats: jest.fn(),
}));

// Mock des composants de graphiques - ils doivent simuler le wrapper div avec role="img"
jest.mock("react-chartjs-2", () => ({
  Bar: jest.fn(({ options, data, ...props }) => {
    const hasDataLabelsPlugin =
      options?.plugins?.datalabels?.display === "auto" || options?.plugins?.datalabels?.display === true;

    return (
      <div data-testid="chart-canvas-container">
        <canvas data-testid="chart-canvas" />
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
  Doughnut: jest.fn(({ data, ...props }) => (
    <div data-testid="chart-canvas-container">
      <canvas data-testid="chart-canvas" />
      {data?.datasets?.[0]?.data?.map((value: number, index: number) => (
        <span key={index} data-testid={`segment-${index}`}>
          {value}
        </span>
      ))}
    </div>
  )),
}));

jest.mock("chartjs-plugin-datalabels", () => ({
  __esModule: true,
  default: {
    id: "datalabels",
  },
}));

// Mock du hook useIsDark
jest.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
  useIsDark: () => ({ isDark: false }),
}));

// Mock de Chart.js
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
    defaults: {
      borderColor: "#eeeeee",
      color: "#4f4f4f",
      elements: {
        bar: {
          backgroundColor: "#000091",
        },
      },
      plugins: {
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#000000",
          bodyColor: "#000000",
        },
      },
    },
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Legend: jest.fn(),
  ArcElement: jest.fn(),
  Tooltip: jest.fn(),
}));

// Mock du ChartTheme
jest.mock("../components/client/ChartTheme", () => ({
  ChartTheme: jest.fn(),
  themeDark: {
    backgroundColor: ["#8585f6", "#6a6af4", "#4f4fd8"],
  },
  themeLight: {
    backgroundColor: ["#000091", "#6a6af4", "#4f4fd8"],
  },
}));

const mockGetPublicStats = getPublicStats as jest.MockedFunction<typeof getPublicStats>;

// Wrapper pour les composants asynchrones
const AsyncWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

describe("Stats Page Accessibility", () => {
  const mockStatsData = {
    year: 2024,
    index: {
      count: 1500,
      average: 85.5,
      countByWorkforceRange: {
        "50:250": 800,
        "251:999": 500,
        "1000:": 200,
      },
      averageByWorkforceRange: {
        "50:250": 82.3,
        "251:999": 86.7,
        "1000:": 89.1,
      },
      lastThreeYearsAverage: {
        2022: 83.2,
        2023: 84.8,
        2024: 85.5,
      },
    },
    balancedRepresentation: {
      count: 200,
      countWomen30percentExecutives: {
        gt: 120,
        lte: 60,
        nc: 20,
      },
      countWomen30percentMembers: {
        gt: 110,
        lte: 70,
        nc: 20,
      },
    },
  };

  beforeEach(() => {
    mockGetPublicStats.mockResolvedValue(mockStatsData);
    jest.clearAllMocks();
  });

  const renderStatsContent = async () => {
    const StatsContentResolved = await StatsContent();
    return render(<AsyncWrapper>{StatsContentResolved}</AsyncWrapper>);
  };

  describe("Structure générale de la page", () => {
    it("devrait afficher les sections principales", async () => {
      await renderStatsContent();

      expect(screen.getByText(/Index Egapro/)).toBeInTheDocument();
      expect(screen.getByText(/Représentation équilibrée/)).toBeInTheDocument();
    });
  });

  describe("Accessibilité des graphiques", () => {
    it("devrait avoir des descriptions détaillées pour tous les graphiques", async () => {
      await renderStatsContent();

      // Vérifier que toutes les descriptions détaillées sont présentes
      const descriptions = [
        "chart-description-déclarants-par-tranche-d'effectifs-assujettis",
        "chart-description-index-moyen-par-tranche-d'effectifs-assujettis",
        "chart-description-index-moyen-par-année-de-déclaration",
        "chart-description-répartition-des-femmes-parmi-les-cadres-dirigeants",
        "chart-description-répartition-des-femmes-parmi-les-membres-des-instances-dirigeantes",
      ];

      descriptions.forEach(id => {
        const description = document.getElementById(id);
        expect(description).toBeInTheDocument();
        expect(description).toHaveClass("sr-only");
      });
    });

    it("devrait associer correctement les graphiques à leurs descriptions", async () => {
      await renderStatsContent();

      // Vérifier les graphiques en barres (wrapper div avec role="img")
      const barCharts = screen.getAllByRole("img");
      expect(barCharts.length).toBeGreaterThanOrEqual(3);

      // Vérifier que chaque graphique a un aria-describedby
      barCharts.forEach(chart => {
        expect(chart).toHaveAttribute("aria-describedby");
        const describedById = chart.getAttribute("aria-describedby");
        expect(describedById).toBeTruthy();

        // Vérifier que l'élément de description existe
        const description = document.getElementById(describedById!);
        expect(description).toBeInTheDocument();
      });
    });

    it("devrait avoir des aria-label descriptifs pour tous les graphiques", async () => {
      await renderStatsContent();

      const allCharts = screen.getAllByRole("img");

      allCharts.forEach(chart => {
        expect(chart).toHaveAttribute("aria-label");
        const ariaLabel = chart.getAttribute("aria-label");
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.length).toBeGreaterThan(10); // Vérifier que ce n'est pas vide
      });
    });

    it("devrait avoir le rôle img pour tous les graphiques", async () => {
      await renderStatsContent();

      const allCharts = screen.getAllByRole("img");
      expect(allCharts.length).toBeGreaterThanOrEqual(5); // 3 BarChart + 2 DoughnutChart

      allCharts.forEach(chart => {
        expect(chart).toHaveAttribute("role", "img");
      });
    });
  });

  describe("Contenu des descriptions détaillées", () => {
    it("devrait inclure les données importantes dans les descriptions", async () => {
      await renderStatsContent();

      // Vérifier la description des déclarants par tranche d'effectifs
      const description1 = document.getElementById("chart-description-déclarants-par-tranche-d'effectifs-assujettis");
      expect(description1?.textContent).toContain("800");
      expect(description1?.textContent).toContain("500");
      expect(description1?.textContent).toContain("200");

      // Vérifier la description de l'index moyen par tranche d'effectifs
      const description2 = document.getElementById("chart-description-index-moyen-par-tranche-d'effectifs-assujettis");
      expect(description2?.textContent).toContain("82");
      expect(description2?.textContent).toContain("87");
      expect(description2?.textContent).toContain("89");

      // Vérifier la description de l'évolution par année
      const description3 = document.getElementById("chart-description-index-moyen-par-année-de-déclaration");
      expect(description3?.textContent).toContain("2023");
      expect(description3?.textContent).toContain("2024");
      expect(description3?.textContent).toContain("2025");
    });

    it("devrait inclure les données de représentation équilibrée", async () => {
      await renderStatsContent();

      // Vérifier la description des cadres dirigeants
      const description4 = document.getElementById(
        "chart-description-répartition-des-femmes-parmi-les-cadres-dirigeants",
      );
      expect(description4?.textContent).toContain("200");
      expect(description4?.textContent).toContain("120");
      expect(description4?.textContent).toContain("60");
      expect(description4?.textContent).toContain("20");

      // Vérifier la description des instances dirigeantes
      const description5 = document.getElementById(
        "chart-description-répartition-des-femmes-parmi-les-membres-des-instances-dirigeantes",
      );
      expect(description5?.textContent).toContain("200");
      expect(description5?.textContent).toContain("110");
      expect(description5?.textContent).toContain("70");
      expect(description5?.textContent).toContain("20");
    });
  });

  describe("Gestion des cas d'erreur", () => {
    it("devrait afficher un message d'erreur quand il n'y a pas de données", async () => {
      mockGetPublicStats.mockResolvedValue({
        ...mockStatsData,
        index: { ...mockStatsData.index, count: 0 },
        balancedRepresentation: { ...mockStatsData.balancedRepresentation, count: 0 },
      });

      await renderStatsContent();

      expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
      expect(screen.getByText("Il n'y a actuellement aucune donnée d'enregistrée.")).toBeInTheDocument();
    });
  });

  describe("Affichage des valeurs sur les graphiques", () => {
    it("devrait afficher les valeurs sur certains graphiques", async () => {
      await renderStatsContent();

      // Les graphiques avec showValue=true devraient avoir des data labels
      const dataLabels = screen.getAllByTestId(/data-label-/);
      expect(dataLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Conformité RGAA", () => {
    it("devrait respecter la structure d'accessibilité RGAA", async () => {
      await renderStatsContent();

      // Vérifier que tous les graphiques ont les attributs ARIA requis
      const allCharts = screen.getAllByRole("img");

      allCharts.forEach(chart => {
        // Critère 1.1 : Alternative textuelle
        expect(chart).toHaveAttribute("aria-label");

        // Critère 1.3 : Alternative textuelle pertinente
        const ariaLabel = chart.getAttribute("aria-label");
        expect(ariaLabel).toMatch(/graphique/i);

        // Rôle sémantique approprié
        expect(chart).toHaveAttribute("role", "img");
      });

      // Vérifier que les descriptions détaillées sont masquées visuellement
      const descriptions = document.querySelectorAll(".sr-only");
      expect(descriptions.length).toBeGreaterThanOrEqual(5);
    });
  });
});
