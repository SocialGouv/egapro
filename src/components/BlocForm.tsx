/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../utils/globalStyles";

import { CellHead, Cell, Cell2 } from "./Cell";

interface Props {
  title: string;
  label: string;
  footer?: string;
  children: ReactNode;
  style?: any;
}

function BlocForm({ title, label, footer, children, style }: Props) {
  return (
    <div css={styles.container}>
      <div css={styles.background} />
      <div css={[styles.blocForm, footer && styles.blocFormWithFooter]}>
        <div css={styles.rowHead}>
          <CellHead style={styles.rowHeadCellHead}>{title}</CellHead>
          <Cell2 style={styles.rowHeadCell}>{label}</Cell2>
          <div css={styles.rowHeadBorder} />
        </div>

        <div css={styles.rowGender}>
          <CellHead />
          <Cell style={styles.cellMen}>hommes</Cell>
          <Cell style={styles.cellWomen}>femmes</Cell>
        </div>

        <div css={styles.blocFormInner}>{children}</div>

        {footer && (
          <div css={styles.rowFoot}>
            <div css={styles.rowFootBorderLeft} />
            <Cell2 style={styles.rowFootCell}>{footer}</Cell2>
            <div css={styles.rowFootBorderRight} />
          </div>
        )}
      </div>
    </div>
  );
}

const PADDING = 20;

const styles = {
  container: css({
    position: "relative",
    marginTop: 50 + 14,
    marginBottom: 20 + 14
  }),
  background: css({
    backgroundColor: "#FFF",
    position: "absolute",
    top: -50,
    bottom: -20,
    left: -38,
    right: -38,
    borderRadius: "100%",
    border: "1px solid #EFECEF"
  }),
  blocForm: css({
    position: "relative",
    borderLeft: `solid ${globalStyles.colors.default} 1px`,
    borderRight: `solid ${globalStyles.colors.default} 1px`,
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    paddingTop: 8,
    paddingBottom: 8
  }),
  blocFormWithFooter: css({
    borderBottom: "none",
    paddingBottom: 8 + 8
  }),
  blocFormInner: css({
    paddingRight: PADDING,
    paddingLeft: PADDING
  }),

  rowHead: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "100%",
    marginBottom: -9,
    minHeight: 16,
    paddingLeft: PADDING
  }),
  rowHeadCellHead: css({
    fontSize: 14,
    textTransform: "uppercase"
  }),
  rowHeadCell: css({
    height: 16,
    fontSize: 11,
    textAlign: "center"
  }),
  rowHeadBorder: css({
    height: 1,
    backgroundColor: globalStyles.colors.default,
    flexShrink: 0,
    width: PADDING,
    marginBottom: 8
  }),

  rowGender: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingRight: PADDING,
    paddingLeft: PADDING,
    marginTop: 12,
    marginBottom: 12
  }),
  cellMen: css({
    fontSize: 12,
    textAlign: "center",
    color: globalStyles.colors.men
  }),
  cellWomen: css({
    fontSize: 12,
    textAlign: "center",
    color: globalStyles.colors.women
  }),

  rowFoot: css({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    height: 16,
    position: "absolute",
    bottom: -7,
    right: 0,
    left: 0
  }),
  rowFootCell: css({
    fontSize: 14,
    textAlign: "center"
  }),
  rowFootBorderLeft: css({
    height: 1,
    marginRight: 2,
    backgroundColor: globalStyles.colors.default,
    flex: 1
  }),
  rowFootBorderRight: css({
    height: 1,
    backgroundColor: globalStyles.colors.default,
    width: PADDING,
    flexShrink: 0
  })
};

export default BlocForm;
