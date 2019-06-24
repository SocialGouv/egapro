/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import { IconWarning } from "../../components/Icons";

import globalStyles from "../../utils/globalStyles";

interface Props {
  allIndicateurValid: boolean;
  noteIndex: number | undefined;
  totalPointCalculable: number;
}

function RecapitulatifIndex({
  allIndicateurValid,
  noteIndex,
  totalPointCalculable
}: Props) {
  return (
    <div css={styles.indexBloc}>
      {allIndicateurValid ? (
        noteIndex ? (
          <InfoBloc title="Index égalité femmes-hommes" icon={null}>
            <div>
              <p css={[styles.blocText, styles.blocTextResult]}>
                <span>votre résultat total est</span>
                <span>{`${noteIndex}/100`}</span>
              </p>
              <p
                css={styles.blocTextDetail}
              >{`nombre de points maximum pouvant être obtenus était de ${totalPointCalculable}`}</p>
            </div>
          </InfoBloc>
        ) : (
          <InfoBloc title="Index égalité femmes-hommes">
            <p css={styles.blocText}>
              Vos indicateurs représentent moins de 75 points, votre index ne
              peut-être calculé.
            </p>
          </InfoBloc>
        )
      ) : (
        <InfoBloc title="Index égalité femmes-hommes">
          <p css={styles.blocText}>
            Vous n’avez pas encore validé tous vos indicateurs, votre index ne
            peut être calculé.
          </p>
        </InfoBloc>
      )}
    </div>
  );
}

interface InfoBlocProps {
  title: string;
  children: ReactNode;
  icon?: "warning" | null;
}

function InfoBloc({ title, children, icon = "warning" }: InfoBlocProps) {
  return (
    <div css={styles.bloc}>
      <p css={styles.blocTitle}>{title}</p>
      <div css={styles.blocBody}>
        {icon === null ? null : (
          <div css={styles.blocIcon}>
            {icon === "warning" ? <IconWarning /> : null}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

const styles = {
  indexBloc: css({
    marginTop: 22,
    marginBottom: 44
  }),

  bloc: css({
    height: 136,
    padding: "26px 16px",
    display: "flex",
    flexDirection: "column",
    backgroundColor: globalStyles.colors.default,
    color: "white",
    "@media print": {
      backgroundColor: "white",
      color: globalStyles.colors.default,
      border: `solid ${globalStyles.colors.default} 1px`
    }
  }),
  blocTitle: css({
    marginBottom: "auto",
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),
  blocBody: {
    marginTop: 4,
    display: "flex",
    alignItems: "flex-end"
  },
  blocIcon: {
    marginRight: 22
  },
  blocText: css({
    fontSize: 14,
    lineHeight: "17px"
  }),
  blocTextResult: css({
    display: "flex",
    justifyContent: "space-between"
  }),
  blocTextDetail: css({
    marginTop: 9,
    paddingRight: 100,
    paddingBottom: 2,
    fontSize: 12,
    lineHeight: "14px",
    fontStyle: "italic",
    borderBottom: "1px solid #FFFFFF"
  })
};

export default RecapitulatifIndex;
