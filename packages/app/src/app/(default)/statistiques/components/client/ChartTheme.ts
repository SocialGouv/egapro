"use client";

import { useIsDark } from "@codegouvfr/react-dsfr/useIsDark";
import { Chart as ChartJS } from "chart.js";

export const themeDark = {
  backgroundColor: ["#518fff", "#00A95F", "#A558A0", "#D8C634", "#34CB6A", "#869ECE", "#FF9575"],
};

export const themeLight = {
  backgroundColor: ["#0063cb", "#00A95F", "#A558A0", "#66673d", "#297254", "#2f4077", "#a94645"],
};

export const ChartTheme = () => {
  const { isDark } = useIsDark();
  ChartJS.defaults.borderColor = isDark ? "#323232" : "#eeeeee";
  ChartJS.defaults.color = isDark ? "#cecece" : "#4f4f4f";
  ChartJS.defaults.elements.bar.backgroundColor = isDark ? themeDark.backgroundColor : themeLight.backgroundColor;
  if (ChartJS.defaults.plugins.tooltip) {
    ChartJS.defaults.plugins.tooltip.backgroundColor = "rgba(22, 22, 22, 0.9)";
    ChartJS.defaults.plugins.tooltip.padding = 12;
  }
  if (ChartJS.defaults.plugins.datalabels) {
    ChartJS.defaults.plugins.datalabels.color = isDark ? "#161616" : "#fff";
    ChartJS.defaults.plugins.datalabels.font = { weight: "bolder", size: 14 };
  }
};
