/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Switch, Link, Route, RouteComponentProps } from "react-router-dom";

function FAQHeaderBackButton({
  history
}: {
  history: RouteComponentProps["history"];
}) {
  return (
    <button css={styles.buttonBack} onClick={() => history.goBack()}>
      <span css={styles.backIcon}>◀</span> retour
    </button>
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
  return (
    <div css={styles.container}>
      <div css={styles.aroundTitle}>
        <Switch location={location}>
          <Route
            exact
            path="/section/:section"
            render={() => <FAQHeaderHomeButton />}
          />
          <Route
            exact
            path="/part/:part/question/:indexQuestion"
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
    all: "unset",
    cursor: "pointer",
    fontSize: 12,
    textDecoration: "none"
  }),
  backIcon: css({
    fontSize: 8
  })
};

export default FAQHeader;
