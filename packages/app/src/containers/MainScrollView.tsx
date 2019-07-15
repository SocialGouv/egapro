/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useEffect, ReactNode } from "react";
import { withRouter, RouteComponentProps } from "react-router-dom";

import { AppState } from "../globals.d";

import { useLayoutType } from "../components/GridContext";
import ModalProvider from "../components/ModalContext";
import ScrollProvider, { useScrollTo } from "../components/ScrollContext";
import Footer from "../components/Footer";
import Menu from "../components/Menu";

interface Props extends RouteComponentProps {
  children: ReactNode;
  state: AppState | undefined;
}

function MainScrollView({ children, state, location }: Props) {
  const layoutType = useLayoutType();

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
        <ScrollProvider style={styles.scroll}>
          {layoutType === "desktop" && <div css={styles.menu}>{menu}</div>}
          <MainView pathname={location.pathname}>{children}</MainView>
        </ScrollProvider>
      </ModalProvider>
    </div>
  );
}

function MainView({
  children,
  pathname
}: {
  children: ReactNode;
  pathname: string;
}) {
  const scrollTo = useScrollTo();

  useEffect(() => scrollTo(0), [pathname, scrollTo]);

  return (
    <div css={styles.viewContainer}>
      <div css={styles.view}>{children}</div>
      <Footer />
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
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0px",
    position: "relative",
    "@media print": {
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
