import { type Any } from "@common/utils/types";
import { clsx } from "clsx";
import { type PropsWithChildren } from "react";

import { FormButton } from "./FormButton";
import style from "./TileCompany.module.css";

export const TileCompany = ({ children }: PropsWithChildren) => <div className={style.tile}>{children}</div>;

export type TileCompanyTitleProps = PropsWithChildren<{
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
}>;

export const TileCompanyTitle = ({ children, titleAs: HtmlTag = "h2" }: TileCompanyTitleProps) => {
  return <HtmlTag className={style.title}>{children}</HtmlTag>;
};

export const TileCompanySiren = ({ children }: PropsWithChildren) => <div className={style.siren}>{children}</div>;

export const TileCompanyLocation = ({ children }: PropsWithChildren) => (
  <div className={style.location}>
    <span className="fr-icon-map-pin-2-fill fr-icon--sm" aria-hidden="true" />
    <span>{children}</span>
  </div>
);

export const TileCompanyTable = ({ children }: PropsWithChildren) => (
  <div className={clsx(style.table)}>
    <table>{children}</table>
  </div>
);

export const TileCompanyTableHead = ({ children }: PropsWithChildren) => (
  <thead className={style.tableHead}>
    <tr>{children}</tr>
  </thead>
);

export type TileCompanyTableHeadColProps = PropsWithChildren<{
  colSpan?: number;
  size?: "md" | "sm";
}>;

export const TileCompanyTableHeadCol = ({ children, size = "sm", colSpan }: TileCompanyTableHeadColProps) => (
  <th className={clsx(style.tableHeadCol, size === "md" && style.tableHeadColMedium)} colSpan={colSpan}>
    {children}
  </th>
);

export const TileCompanyTableBody = ({ children }: PropsWithChildren) => <tbody>{children}</tbody>;

export const TileCompanyTableBodyRow = ({ children }: PropsWithChildren) => (
  <tr className={style.tableBodyRow}>{children}</tr>
);

export const TileCompanyTableBodyRowCol = ({ children }: PropsWithChildren) => (
  <td className={style.tableBodyRowCol}>{children}</td>
);

export const TileCompanyYear = ({ year }: { year: number }) => (
  <>
    <div className={style.tableYear}>{year}</div>
    <div className={style.tableYearLegend}>(données {year - 1})</div>
  </>
);

export const TileCompanyPercent = ({ children }: PropsWithChildren) => (
  <div className={style.tablePercent}>{children}</div>
);

type TileCompanyPercentDataProps = {
  legend: string;
  number: number | null;
};

export const TileCompanyPercentData = ({ number, legend }: TileCompanyPercentDataProps) => {
  const isNumber = !Number.isNaN(parseInt(number as Any));
  return (
    <div>
      <div className={clsx(style.tablePercentData, !isNumber && style.tablePercentNoData)}>
        {isNumber ? (
          <>
            <span>{number}</span>
            <span className={style.tablePercentDataUnit}>&nbsp;%</span>
          </>
        ) : (
          <span>NC</span>
        )}
      </div>
      <div className={clsx(style.tablePercentLegend, !isNumber && style.tablePercentNoData)}>{legend}</div>
    </div>
  );
};

type TileCompanyLoadMoreProps = {
  onClick: VoidFunction;
};

export const TileCompanyLoadMore = ({ onClick }: TileCompanyLoadMoreProps) => (
  <div className={style.tableCompanyLoadMore}>
    <FormButton size="sm" variant="tertiary-no-outline" onClick={onClick} iconLeft="fr-icon-add-line">
      Afficher plus d’années
    </FormButton>
  </div>
);
