/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Switch, Link, Route, RouteComponentProps } from "react-router-dom";

import globalStyles from "../../../utils/globalStyles";
import ActionLink from "../../../components/ActionLink";
import { useLayoutType } from "../../../components/GridContext";

function FAQHeaderBackButton({
  history
}: {
  history: RouteComponentProps["history"];
}) {
  return (
    <ActionLink style={styles.buttonBack} onClick={() => history.goBack()}>
      <span css={styles.backIcon}>◀</span> retour
    </ActionLink>
  );
}

function FAQHeaderHomeButton() {
  return (
    <Link to={{ state: { faq: "/" } }} css={styles.buttonBack}>
      <span css={styles.backIcon}>◀</span> voir toute l’aide
    </Link>
  );
}

function FAQHeader({
  location
}: {
  location: RouteComponentProps["location"];
}) {
  const layoutType = useLayoutType();
  return (
    <div
      css={[
        styles.container,
        layoutType === "tablet" && styles.containerTablet,
        layoutType === "mobile" && styles.containerMobile
      ]}
    >
      <div css={styles.aroundTitle}>
        <Switch location={location}>
          <Route
            exact
            path="/section/:section"
            render={() => <FAQHeaderHomeButton />}
          />
          <Route
            exact
            path={["/part/:part/question/:indexQuestion", "/referent"]}
            render={({ history }) => <FAQHeaderBackButton history={history} />}
          />
        </Switch>
      </div>
      <span css={styles.title}>Aide</span>
      <div css={styles.aroundTitle} />
    </div>
  );
}

const styles = {
  container: css({
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderBottom: "1px solid #EFECEF",
    marginRight: 29,
    marginLeft: 29
  }),
  containerTablet: css({
    marginRight: 21,
    marginLeft: 21
  }),
  containerMobile: css({
    height: 44,
    marginRight: globalStyles.grid.gutterWidth,
    marginLeft: globalStyles.grid.gutterWidth
  }),
  title: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 18
  }),
  aroundTitle: css({
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 100
  }),
  buttonBack: css({
    color: globalStyles.colors.default,
    fontSize: 12,
    textDecoration: "none"
  }),
  backIcon: css({
    fontSize: 8
  })
};

export default FAQHeader;
