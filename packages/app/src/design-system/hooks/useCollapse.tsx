import { useEffect, useState } from "react";

export const useCollapse = (id: string, isExpanded: boolean) => {
  const expandedItem = (isExpanded: boolean) => {
    if (isExpanded) {
      return {
        class: "fr-collapse fr-collapse--expanded",
        stateHeight: "none",
      };
    } else {
      return {
        class: "fr-collapse",
        stateHeight: undefined,
      };
    }
  };
  const [collapse, setCollapse] = useState("0px");
  const item = expandedItem(isExpanded);
  useEffect(() => {
    const element = document.getElementById(id);
    if (element) {
      setCollapse(`-${element.getBoundingClientRect().height}px`);
    }
  }, [id]);
  return { item, collapse };
};
