/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useEffect, useRef, ReactNode } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";

import { AppState } from "../globals.d";

import { useLayoutType } from "../components/GridContext";
import ModalProvider from "../components/ModalContext";
import Footer from "../components/Footer";
import Menu from "../components/Menu";

interface Props extends RouteComponentProps {
  children: ReactNode;
  state: AppState | undefined;
}

function MainScrollView({ children, state, location }: Props) {
  const scrollEl = useRef<HTMLDivElement>(null);

  const layoutType = useLayoutType();

  useEffect(() => {
    if (scrollEl.current) {
      if (scrollEl.current.scrollTo) {
        scrollEl.current.scrollTo(0, 0);
      } else {
        scrollEl.current.scrollTop = 0;
      }
    }
  }, [location.pathname]);

  const menu = (
    <Menu
      effectifFormValidated={state ? state.effectif.formValidated : "None"}
      indicateurUnFormValidated={
        state ? state.indicateurUn.formValidated : "None"
      }
      indicateurDeuxFormValidated={
        state ? state.indicateurDeux.formValidated : "None"
      }
      indicateurTroisFormValidated={
        state ? state.indicateurTrois.formValidated : "None"
      }
      indicateurQuatreFormValidated={
        state ? state.indicateurQuatre.formValidated : "None"
      }
      indicateurCinqFormValidated={
        state ? state.indicateurCinq.formValidated : "None"
      }
    />
  );

  return (
    <div css={styles.main}>
      <ModalProvider>
        {layoutType === "tablet" && menu}
        <div css={styles.scroll} ref={scrollEl}>
          {layoutType === "desktop" && <div css={styles.menu}>{menu}</div>}
          <div css={styles.viewContainer}>
            <div css={styles.view}>{children}</div>
            <Footer />
          </div>
        </div>
      </ModalProvider>
    </div>
  );
}

const styles = {
  main: css({
    borderRight: "1px solid #EFECEF",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    position: "relative"
  }),
  scroll: css({
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    position: "relative",
    "@media print": {
      overflow: "visible",
      display: "block",
      borderRight: "none",
      background: "none"
    }
  }),
  menu: css({
    position: "sticky",
    top: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    paddingBottom: 80,
    "@media print": {
      display: "none"
    }
  }),
  viewContainer: css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    "@media print": {
      display: "block"
    }
  }),
  view: css({
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: "auto",
    display: "flex",
    flexDirection: "column"
  })
};

export default withRouter(MainScrollView);
