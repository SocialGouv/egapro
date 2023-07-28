"use client";

import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Doughnut } from "react-chartjs-2";

import { ChartTheme, themeDark, themeLight } from "./ChartTheme";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

export type DoughnutChartProps = {
  data: Array<{ legend: string; value: number }>;
  tooltipLegend: string;
};

export const DoughnutChart = ({ tooltipLegend, data }: DoughnutChartProps) => {
  ChartTheme();
  const { isDark } = useIsDark();
  return (
    <Doughnut
      data={{
        labels: data.map(d => d.legend),
        datasets: [
          {
            label: tooltipLegend,
            data: data.map(d => d.value),
            backgroundColor: isDark ? themeDark.backgroundColor : themeLight.backgroundColor,
            borderWidth: 0,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            align: "start",
            labels: {
              boxWidth: 32,
              boxHeight: 16,
              useBorderRadius: true,
              borderRadius: 4,
              padding: 12,
            },
          },
          datalabels: {
            backgroundColor: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
            padding: 10,
            borderRadius: 30,
          },
        },
      }}
    />
  );
};
