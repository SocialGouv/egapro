/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

interface Props {
  title: string;
  text?: ReactNode;
  icon?: "warning" | "cross" | null;
}

function IconWarning() {
  return (
    <svg
      width="40"
      height="35"
      viewBox="0 0 40 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M28.7141 14.5L30.7662 18L32.8182 21.5"
        stroke="#191A49"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M26.662 11L22.588 4.28044C21.4131 2.34268 18.5965 2.3571 17.4415 4.30678L2.68288 29.221C1.49824 31.2208 2.93964 33.75 5.264 33.75H34.7216C37.046 33.75 38.4874 31.2208 37.3027 29.221L34.9874 25.3125"
        stroke="#191A49"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="27" r="2" fill="#191A49" />
      <path
        d="M18.0815 12.5707L19.7525 24.2676C19.7934 24.5538 20.2066 24.5538 20.2475 24.2676L21.9185 12.5707C21.9615 12.2695 21.7278 12 21.4235 12H18.5765C18.2722 12 18.0385 12.2695 18.0815 12.5707Z"
        fill="#191A49"
      />
    </svg>
  );
}

function IconCircleCross() {
  return (
    <svg
      width="35"
      height="34"
      viewBox="0 0 35 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="17.9928"
        cy="17.357"
        rx="15.9942"
        ry="15.4286"
        stroke="#191A49"
        strokeWidth="2"
      />
      <path
        d="M10.0945 24.9764L25.8913 9.73828M10.0945 9.73828L25.8913 24.9764"
        stroke="#191A49"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoBloc({ title, text, icon = "warning" }: Props) {
  return (
    <div css={styles.bloc}>
      <p css={styles.blocTitle}>{title}</p>
      {text && (
        <div css={styles.blocBody}>
          {icon === null ? null : (
            <div css={styles.blocIcon}>
              {icon === "cross" ? <IconCircleCross /> : <IconWarning />}
            </div>
          )}
          <p css={styles.blocText}>{text}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  bloc: css({
    padding: 16,
    backgroundColor: "#FFF",
    border: "1px solid #EFECEF"
  }),
  blocTitle: css({
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
  })
};

export default InfoBloc;
