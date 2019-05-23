import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
  ReactNode
} from "react";

import globalStyles from "../utils/globalStyles";
const { grid } = globalStyles;

const gutterCount = grid.columns + 1;
const totalGuttersWidth = gutterCount * grid.gutterWidth;

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function getColumnWidth(windowWidth: number) {
  const clampedWidth = clamp(windowWidth, grid.minWidth, grid.maxWidth);
  const availableWidthWithoutGutters = clampedWidth - totalGuttersWidth;
  const columnWidth = availableWidthWithoutGutters / 12;
  return Math.floor(columnWidth);
}

// Context

export const GridContext = React.createContext({
  columnWidth: getColumnWidth(window.innerWidth),
  gutterWidth: grid.gutterWidth
});

// Provider

function GridProvider({ children }: { children: ReactNode }) {
  const [columnWidth, setColumnWidth] = useState(
    getColumnWidth(window.innerWidth)
  );

  const handleResize = useCallback(
    (event: any) =>
      setColumnWidth(getColumnWidth(event.currentTarget.innerWidth)),
    [setColumnWidth]
  );

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  const value = useMemo(
    () => ({
      columnWidth,
      gutterWidth: grid.gutterWidth
    }),
    [columnWidth]
  );

  return <GridContext.Provider value={value}>{children}</GridContext.Provider>;
}

export default GridProvider;

// Consumer

export const useGridContext = () => useContext(GridContext);

export const useColumnsWidth = (numColumns: number) => {
  const { columnWidth, gutterWidth } = useGridContext();
  return columnWidth * numColumns + gutterWidth * (numColumns - 1);
};
