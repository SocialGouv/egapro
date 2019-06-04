/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode, Fragment } from "react";

import globalStyles from "../utils/globalStyles";

export function IconValid() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      css={styles.strokeCurrentColor}
    >
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path
        d="M7.72228 3.27783L5.5 8.00005L3.5 5.50005"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconInvalid() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      css={styles.strokeCurrentColor}
    >
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path
        d="M3.27783 7.72228L7.72228 3.27783M3.27783 3.27783L7.72228 7.72228"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMale() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.77818 6.71743C6.60661 5.54586 4.70711 5.54586 3.53554 6.71743C2.36397 7.889 2.36397 9.7885 3.53554 10.9601C4.70711 12.1316 6.60661 12.1316 7.77818 10.9601C8.94975 9.7885 8.94975 7.889 7.77818 6.71743ZM2.82843 6.01032C4.27102 4.56773 6.54135 4.45737 8.11059 5.67923C8.11737 5.67158 8.12441 5.66409 8.13173 5.65677L10.1066 3.6819L8.48529 3.6819C8.20914 3.6819 7.98529 3.45804 7.98529 3.1819C7.98529 2.90575 8.20914 2.6819 8.48529 2.6819L11.3137 2.6819C11.3815 2.6819 11.4462 2.69539 11.5051 2.71984C11.5632 2.74388 11.6177 2.77934 11.6651 2.82623C11.6659 2.82693 11.6666 2.82764 11.6673 2.82834C11.668 2.82905 11.6687 2.82976 11.6694 2.83047C11.7586 2.92078 11.8137 3.0449 11.8137 3.1819L11.8137 6.01032C11.8137 6.28647 11.5899 6.51032 11.3137 6.51032C11.0376 6.51032 10.8137 6.28647 10.8137 6.01032L10.8137 4.389L8.83884 6.36388C8.83152 6.3712 8.82403 6.37824 8.81638 6.38502C10.0382 7.95426 9.92788 10.2246 8.48529 11.6672C6.92319 13.2293 4.39053 13.2293 2.82843 11.6672C1.26634 10.1051 1.26634 7.57242 2.82843 6.01032Z"
        fill={globalStyles.colors.men}
      />
    </svg>
  );
}

export function IconFemale() {
  return (
    <svg
      width="15"
      height="13"
      viewBox="0 0 8 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 7C5.65685 7 7 5.65685 7 4C7 2.34315 5.65685 1 4 1C2.34315 1 1 2.34315 1 4C1 5.65685 2.34315 7 4 7ZM8 4C8 6.04013 6.47267 7.72354 4.49906 7.96917C4.49969 7.97937 4.5 7.98965 4.5 8V9.5H6C6.27614 9.5 6.5 9.72386 6.5 10C6.5 10.2761 6.27614 10.5 6 10.5H4.5V12C4.5 12.2761 4.27614 12.5 4 12.5C3.72386 12.5 3.5 12.2761 3.5 12V10.5H2C1.72386 10.5 1.5 10.2761 1.5 10C1.5 9.72386 1.72386 9.5 2 9.5H3.5V8C3.5 7.98965 3.50031 7.97937 3.50094 7.96917C1.52733 7.72354 0 6.04013 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z"
        fill={globalStyles.colors.women}
      />
    </svg>
  );
}

const styles = {
  strokeCurrentColor: css({
    stroke: "currentColor"
  })
};

// Pour le pas à pas

export function IconText({ children }: { children: ReactNode }) {
  return <div css={stylesIcon.icon}>{children}</div>;
}

const stylesIcon = {
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    border: `solid ${globalStyles.colors.default} 1px`,

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    fontSize: 12
  }
};

function SubIconValid() {
  return (
    <Fragment>
      <circle cx="33" cy="15" r="6" fill="white" stroke="#191A49" />
      <path
        d="M35.9631 12.0371L33 18.3334L30.3334 15.0001"
        stroke="#191A49"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Fragment>
  );
}

function SubIconInvalid() {
  return (
    <Fragment>
      <circle cx="33" cy="15" r="6" fill="white" stroke="#191A49" />
      <path
        d="M30.0371 17.963L35.963 12.0371M30.0371 12.0371L35.963 17.963"
        stroke="#191A49"
        strokeLinecap="round"
      />
    </Fragment>
  );
}

export function IconLamp() {
  return (
    <svg
      width="45"
      height="45"
      viewBox="0 0 45 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="22.5" cy="22.5" r="22" fill="white" stroke="#191A49" />
      <path
        d="M24.4615 33.0726H24.4365V33.0976C24.4365 34.126 23.5623 34.975 22.5 34.975C21.4377 34.975 20.5635 34.126 20.5635 33.0976V33.0726H20.5385H20.2115C19.1826 33.0726 18.275 32.2563 18.275 31.1951V27.3902C18.275 25.831 17.503 24.783 16.5505 23.4902C16.4578 23.3643 16.3634 23.2361 16.2678 23.1049C15.1897 21.6252 14.025 19.7805 14.025 16.8773C14.025 12.2779 18.1856 9.025 22.5 9.025C26.8144 9.025 30.975 12.2779 30.975 16.8773C30.975 19.7805 29.8103 21.6252 28.7322 23.1049C28.6366 23.2361 28.5422 23.3643 28.4495 23.4902C27.497 24.783 26.725 25.831 26.725 27.3902V31.1951C26.725 32.2563 25.8174 33.0726 24.7885 33.0726H24.4615ZM19.492 26.759L19.4945 26.7811H19.5168H25.4832H25.5055L25.508 26.759C25.695 25.1324 26.5767 23.938 27.4396 22.7691C27.5303 22.6463 27.6207 22.5238 27.7101 22.4011C28.757 20.9644 29.7173 19.4797 29.7173 16.8773C29.7173 12.9901 26.1592 10.2433 22.5 10.2433C18.8408 10.2433 15.2827 12.9901 15.2827 16.8773C15.2827 19.4797 16.243 20.9644 17.2899 22.4011C17.3793 22.5238 17.4697 22.6463 17.5604 22.7691C18.4233 23.938 19.305 25.1324 19.492 26.759ZM24.4205 11.5913L24.4206 11.5913C24.5077 11.5916 24.5964 11.6032 24.6888 11.6297C26.7012 12.3661 28.2001 14.0787 28.5848 16.1783L28.5848 16.1784C28.6435 16.4904 28.3983 16.8249 28.0738 16.8824C27.7495 16.9398 27.4055 16.7097 27.3467 16.397C27.0398 14.7222 25.8362 13.3471 24.2351 12.7616L24.235 12.7615C23.9622 12.6631 23.7822 12.3636 23.8321 12.0872C23.8852 11.9009 23.9687 11.7773 24.0693 11.7002C24.1701 11.6229 24.2905 11.5907 24.4205 11.5913ZM25.4673 28.0244V27.9994H25.4423H19.5577H19.5327V28.0244V29.2927V29.3177H19.5577H25.4423H25.4673V29.2927V28.0244ZM25.4673 30.561V30.536H25.4423H19.5577H19.5327V30.561V31.1951C19.5327 31.592 19.8614 31.8543 20.2115 31.8543H24.7885C25.1386 31.8543 25.4673 31.592 25.4673 31.1951V30.561ZM23.1788 33.0976V33.0726H23.1538H21.8462H21.8212V33.0976C21.8212 33.4744 22.1134 33.7567 22.5 33.7567C22.8866 33.7567 23.1788 33.4744 23.1788 33.0976Z"
        fill="#191A49"
        stroke="white"
        strokeWidth="0.05"
      />
    </svg>
  );
}

export function IconPeople({ valid }: { valid?: boolean }) {
  return (
    <svg
      width="45"
      height="45"
      viewBox="0 0 45 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="22.5" cy="22.5" r="22.5" fill="white" />
      <path
        d="M22.5 20C16.7427 20 14.016 25.7102 12.8242 29.6163C12.1867 31.7058 13.3529 33.8213 15.4519 34.4271C17.3539 34.976 19.8608 35.5 22.5 35.5C25.1392 35.5 27.6461 34.976 29.5481 34.4271C31.6471 33.8213 32.8133 31.7058 32.1758 29.6163C30.984 25.7102 28.2573 20 22.5 20Z"
        fill="white"
        stroke="#191A49"
      />
      <circle
        cx="22.3924"
        cy="16.3506"
        r="5.85061"
        fill="white"
        stroke="#191A49"
      />
      {valid === true && <SubIconValid />}
      {valid === false && <SubIconInvalid />}
      <circle cx="22.5" cy="22.5" r="22" stroke="#191A49" />
    </svg>
  );
}

export function IconCalendar({ valid }: { valid?: boolean }) {
  return (
    <svg
      width="45"
      height="45"
      viewBox="0 0 45 45"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="22.5" cy="22.5" r="22" fill="white" stroke="#191A49" />
      <path d="M9.5 20H35" stroke="#191A49" />
      <rect x="9.5" y="11.5" width="26" height="23" rx="1.5" stroke="#191A49" />
      <circle cx="16" cy="15" r="1.5" stroke="#191A49" />
      <path d="M16 13L16 10" stroke="#191A49" strokeLinecap="round" />
      <circle cx="30" cy="15" r="1.5" stroke="#191A49" />
      <path d="M30 13L30 10" stroke="#191A49" strokeLinecap="round" />
      {valid === true && <SubIconValid />}
      {valid === false && <SubIconInvalid />}
    </svg>
  );
}
