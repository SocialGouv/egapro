/** @jsx jsx */
import {FC} from "react";
import Button from "../../components/MinistereTravail/Button";
import {css, jsx} from "@emotion/core";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  previousPage: () => void;
  nextPage: () => void;
}

const Pagination: FC<PaginationProps> = ({ pageIndex, pageCount, previousPage, nextPage }) => (
  <div css={styles.paginationBar}>
    <div style={{ visibility: pageIndex > 0 ? "visible" : "hidden"}}>
      <Button onClick={previousPage}>{"<<"}</Button>
    </div>
    <div>page {pageIndex + 1}/{pageCount}</div>
    <div style={{ visibility: pageIndex < pageCount - 1 ? "visible" : "hidden"}}>
      <Button onClick={nextPage}>{">>"}</Button>
    </div>
  </div>
);

const styles = {
  paginationBar: css({
    display: "flex",
    justifyContent: "space-between"
  })
};

export default Pagination;
