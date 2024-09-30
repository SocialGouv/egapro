"use client";

import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

import { ChartTheme, themeDark, themeLight } from "./ChartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Legend, ChartDataLabels);

export type BarChartProps = {
  data: Array<{ legend: number | string; value: number }>;
  showValue?: boolean;
  theme?: "monochrome" | "multicolor";
  tooltipLegend: string;
  xAxisSuggestedMax?: number;
  yAxisMin?: number;
};

export const BarChart = ({
  xAxisSuggestedMax = 100,
  yAxisMin = 0,
  tooltipLegend,
  data,
  showValue = false,
  theme = "monochrome",
}: BarChartProps) => {
  ChartTheme();
  const { isDark } = useIsDark();
  return (
    <Bar
      options={{
        scales: {
          x: {
            min: yAxisMin,
            suggestedMax: xAxisSuggestedMax,
          },
        },
        indexAxis: "y",
        responsive: true,
        plugins: {
          legend: {
            display: false,
          },
          title: {
            display: false,
          },
          datalabels: {
            display: showValue ? "auto" : false,
            clamp: true,
            clip: true,
          },
        },
      }}
      data={{
        labels: data.map(d => d.legend),
        datasets: [
          {
            label: tooltipLegend,
            data: data.map(d => d.value),
            backgroundColor:
              theme === "multicolor"
                ? data.map((_d, i) => (isDark ? themeDark.backgroundColor[i] : themeLight.backgroundColor[i]))
                : isDark
                  ? "#8585f6"
                  : "#000091",
          },
        ],
      }}
    />
  );
};
