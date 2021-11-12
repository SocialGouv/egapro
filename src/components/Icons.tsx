/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { ReactNode, Fragment } from "react"

import globalStyles from "../utils/globalStyles"

export function IconWarning({ width = 40, height = 35 }: { width?: number; height?: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 35"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      css={[styles.strokeCurrentColor, styles.fillCurrentColor]}
      aria-hidden="true"
    >
      <path
        d="M5.264 33.75H34.7216C37.046 33.75 38.4874 31.2208 37.3027 29.221L34.9874 25.3125L26.662 11L22.588 4.28044C21.4131 2.34268 18.5965 2.3571 17.4415 4.30678L2.68288 29.221C1.49824 31.2208 2.93964 33.75 5.264 33.75Z"
        stroke="#696CD1"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M20.5 23.1115C20.5 23.4001 20.2736 23.6224 20 23.6224C19.7314 23.6224 19.5 23.3937 19.5 23.1115L19.5 13.0109C19.5 12.7223 19.7264 12.5 20 12.5C20.2686 12.5 20.5 12.7287 20.5 13.0109L20.5 23.1115ZM19.5 26.9796C19.5 26.6826 19.7333 26.4592 20 26.4592C20.2667 26.4592 20.5 26.6826 20.5 26.9796C20.5 27.2766 20.2667 27.5 20 27.5C19.7333 27.5 19.5 27.2766 19.5 26.9796Z"
        stroke="#696CD1"
      />
    </svg>
  )
}

export function IconCircleCross() {
  return (
    <svg
      width="35"
      height="34"
      viewBox="0 0 35 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      css={[styles.strokeCurrentColor]}
      aria-hidden="true"
    >
      <ellipse cx="17.9928" cy="17.357" rx="15.9942" ry="15.4286" strokeWidth="2" />
      <path
        d="M10.0945 24.9764L25.8913 9.73828M10.0945 9.73828L25.8913 24.9764"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconValid() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      css={styles.strokeCurrentColor}
      aria-hidden="true"
    >
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path d="M7.72228 3.27783L5.5 8.00005L3.5 5.50005" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
      aria-hidden="true"
    >
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path d="M3.27783 7.72228L7.72228 3.27783M3.27783 3.27783L7.72228 7.72228" strokeLinecap="round" />
    </svg>
  )
}

export function IconMale() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.77818 6.71743C6.60661 5.54586 4.70711 5.54586 3.53554 6.71743C2.36397 7.889 2.36397 9.7885 3.53554 10.9601C4.70711 12.1316 6.60661 12.1316 7.77818 10.9601C8.94975 9.7885 8.94975 7.889 7.77818 6.71743ZM2.82843 6.01032C4.27102 4.56773 6.54135 4.45737 8.11059 5.67923C8.11737 5.67158 8.12441 5.66409 8.13173 5.65677L10.1066 3.6819L8.48529 3.6819C8.20914 3.6819 7.98529 3.45804 7.98529 3.1819C7.98529 2.90575 8.20914 2.6819 8.48529 2.6819L11.3137 2.6819C11.3815 2.6819 11.4462 2.69539 11.5051 2.71984C11.5632 2.74388 11.6177 2.77934 11.6651 2.82623C11.6659 2.82693 11.6666 2.82764 11.6673 2.82834C11.668 2.82905 11.6687 2.82976 11.6694 2.83047C11.7586 2.92078 11.8137 3.0449 11.8137 3.1819L11.8137 6.01032C11.8137 6.28647 11.5899 6.51032 11.3137 6.51032C11.0376 6.51032 10.8137 6.28647 10.8137 6.01032L10.8137 4.389L8.83884 6.36388C8.83152 6.3712 8.82403 6.37824 8.81638 6.38502C10.0382 7.95426 9.92788 10.2246 8.48529 11.6672C6.92319 13.2293 4.39053 13.2293 2.82843 11.6672C1.26634 10.1051 1.26634 7.57242 2.82843 6.01032Z"
        fill={globalStyles.colors.men}
      />
    </svg>
  )
}

export function IconFemale() {
  return (
    <svg
      width="15"
      height="13"
      viewBox="0 0 8 13"
      fill="none"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4 7C5.65685 7 7 5.65685 7 4C7 2.34315 5.65685 1 4 1C2.34315 1 1 2.34315 1 4C1 5.65685 2.34315 7 4 7ZM8 4C8 6.04013 6.47267 7.72354 4.49906 7.96917C4.49969 7.97937 4.5 7.98965 4.5 8V9.5H6C6.27614 9.5 6.5 9.72386 6.5 10C6.5 10.2761 6.27614 10.5 6 10.5H4.5V12C4.5 12.2761 4.27614 12.5 4 12.5C3.72386 12.5 3.5 12.2761 3.5 12V10.5H2C1.72386 10.5 1.5 10.2761 1.5 10C1.5 9.72386 1.72386 9.5 2 9.5H3.5V8C3.5 7.98965 3.50031 7.97937 3.50094 7.96917C1.52733 7.72354 0 6.04013 0 4C0 1.79086 1.79086 0 4 0C6.20914 0 8 1.79086 8 4Z"
        fill={globalStyles.colors.women}
      />
    </svg>
  )
}

export function IconSearch() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="8" cy="8" r="7.5" stroke={globalStyles.colors.primary} />
      <path
        d="M17.6464 18.3536C17.8417 18.5488 18.1583 18.5488 18.3536 18.3536C18.5488 18.1583 18.5488 17.8417 18.3536 17.6464L17.6464 18.3536ZM18.3536 17.6464L13.3536 12.6464L12.6464 13.3536L17.6464 18.3536L18.3536 17.6464Z"
        fill={globalStyles.colors.primary}
      />
    </svg>
  )
}

export function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 17L17 1M1 1L17 17" stroke={globalStyles.colors.primary} strokeLinecap="round" />
    </svg>
  )
}

const styles = {
  strokeCurrentColor: css({
    stroke: "currentColor",
  }),
  fillCurrentColor: css({
    fill: "currentColor",
  }),
}

// Pour le pas à pas

export function IconText({ children }: { children: ReactNode }) {
  return <div css={stylesIcon.icon}>{children}</div>
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

    fontSize: 12,
  },
}

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
  )
}

function SubIconInvalid() {
  return (
    <Fragment>
      <circle cx="33" cy="15" r="6" fill="white" stroke="#191A49" />
      <path d="M30.0371 17.963L35.963 12.0371M30.0371 12.0371L35.963 17.963" stroke="#191A49" strokeLinecap="round" />
    </Fragment>
  )
}

export function IconLamp() {
  return (
    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22.5" cy="22.5" r="22" fill="white" stroke="#191A49" />
      <path
        d="M24.4615 33.0726H24.4365V33.0976C24.4365 34.126 23.5623 34.975 22.5 34.975C21.4377 34.975 20.5635 34.126 20.5635 33.0976V33.0726H20.5385H20.2115C19.1826 33.0726 18.275 32.2563 18.275 31.1951V27.3902C18.275 25.831 17.503 24.783 16.5505 23.4902C16.4578 23.3643 16.3634 23.2361 16.2678 23.1049C15.1897 21.6252 14.025 19.7805 14.025 16.8773C14.025 12.2779 18.1856 9.025 22.5 9.025C26.8144 9.025 30.975 12.2779 30.975 16.8773C30.975 19.7805 29.8103 21.6252 28.7322 23.1049C28.6366 23.2361 28.5422 23.3643 28.4495 23.4902C27.497 24.783 26.725 25.831 26.725 27.3902V31.1951C26.725 32.2563 25.8174 33.0726 24.7885 33.0726H24.4615ZM19.492 26.759L19.4945 26.7811H19.5168H25.4832H25.5055L25.508 26.759C25.695 25.1324 26.5767 23.938 27.4396 22.7691C27.5303 22.6463 27.6207 22.5238 27.7101 22.4011C28.757 20.9644 29.7173 19.4797 29.7173 16.8773C29.7173 12.9901 26.1592 10.2433 22.5 10.2433C18.8408 10.2433 15.2827 12.9901 15.2827 16.8773C15.2827 19.4797 16.243 20.9644 17.2899 22.4011C17.3793 22.5238 17.4697 22.6463 17.5604 22.7691C18.4233 23.938 19.305 25.1324 19.492 26.759ZM24.4205 11.5913L24.4206 11.5913C24.5077 11.5916 24.5964 11.6032 24.6888 11.6297C26.7012 12.3661 28.2001 14.0787 28.5848 16.1783L28.5848 16.1784C28.6435 16.4904 28.3983 16.8249 28.0738 16.8824C27.7495 16.9398 27.4055 16.7097 27.3467 16.397C27.0398 14.7222 25.8362 13.3471 24.2351 12.7616L24.235 12.7615C23.9622 12.6631 23.7822 12.3636 23.8321 12.0872C23.8852 11.9009 23.9687 11.7773 24.0693 11.7002C24.1701 11.6229 24.2905 11.5907 24.4205 11.5913ZM25.4673 28.0244V27.9994H25.4423H19.5577H19.5327V28.0244V29.2927V29.3177H19.5577H25.4423H25.4673V29.2927V28.0244ZM25.4673 30.561V30.536H25.4423H19.5577H19.5327V30.561V31.1951C19.5327 31.592 19.8614 31.8543 20.2115 31.8543H24.7885C25.1386 31.8543 25.4673 31.592 25.4673 31.1951V30.561ZM23.1788 33.0976V33.0726H23.1538H21.8462H21.8212V33.0976C21.8212 33.4744 22.1134 33.7567 22.5 33.7567C22.8866 33.7567 23.1788 33.4744 23.1788 33.0976Z"
        fill="#191A49"
        stroke="white"
        strokeWidth="0.05"
      />
    </svg>
  )
}

export function IconPeople({ valid }: { valid?: boolean }) {
  return (
    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22.5" cy="22.5" r="22.5" fill="white" />
      <path
        d="M22.5 20C16.7427 20 14.016 25.7102 12.8242 29.6163C12.1867 31.7058 13.3529 33.8213 15.4519 34.4271C17.3539 34.976 19.8608 35.5 22.5 35.5C25.1392 35.5 27.6461 34.976 29.5481 34.4271C31.6471 33.8213 32.8133 31.7058 32.1758 29.6163C30.984 25.7102 28.2573 20 22.5 20Z"
        fill="white"
        stroke="#191A49"
      />
      <circle cx="22.3924" cy="16.3506" r="5.85061" fill="white" stroke="#191A49" />
      {valid === true && <SubIconValid />}
      {valid === false && <SubIconInvalid />}
      <circle cx="22.5" cy="22.5" r="22" stroke="#191A49" />
    </svg>
  )
}

export function IconCalendar({ valid }: { valid?: boolean }) {
  return (
    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
  )
}

export function IconMoney({ valid }: { valid?: boolean }) {
  return (
    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22.5" cy="22.5" r="22" fill="white" stroke="#191A49" />
      <path
        d="M17.2588 13.056L23 11.5176L28.7412 13.056L32.944 17.2588L34.4824 23L32.944 28.7412L28.7412 32.944L23 34.4824L17.2588 32.944L13.056 28.7412L11.5176 23L13.056 17.2588L17.2588 13.056Z"
        stroke="#191A49"
        strokeLinejoin="round"
      />
      <path
        d="M18.2588 14.788L23 13.5176L27.7412 14.788L31.212 18.2588L32.4824 23L31.212 27.7412L27.7412 31.212L23 32.4824L18.2588 31.212L14.788 27.7412L13.5176 23L14.788 18.2588L18.2588 14.788Z"
        stroke="#191A49"
        strokeLinejoin="round"
      />
      {valid === true && <SubIconValid />}
      {valid === false && <SubIconInvalid />}
      <path
        d="M24.0577 26.8187C24.9185 26.8187 25.7427 26.6264 26.5302 26.2418L26.6676 27.4505C25.8709 27.8168 24.9963 28 24.044 28C22.9176 28 21.9377 27.7024 21.1044 27.1071C20.2802 26.5119 19.717 25.6923 19.4148 24.6484H18V23.6319H19.2225C19.2042 23.3571 19.1951 23.1465 19.1951 23C19.1951 22.7527 19.2088 22.5147 19.2363 22.2857H18V21.2692H19.4423C19.7537 20.2527 20.326 19.456 21.1593 18.8791C21.9927 18.293 22.9725 18 24.0989 18C24.5659 18 25.0238 18.0504 25.4725 18.1511C25.9212 18.2518 26.3196 18.3892 26.6676 18.5632L26.5302 19.772C25.706 19.3782 24.891 19.1813 24.0852 19.1813C23.3068 19.1813 22.6474 19.369 22.1071 19.7445C21.576 20.1108 21.1822 20.619 20.9258 21.2692H24.9918V22.2857H20.6648C20.6374 22.5147 20.6236 22.7527 20.6236 23C20.6236 23.2106 20.6374 23.4212 20.6648 23.6319H24.9918V24.6484H20.8984C21.1364 25.3168 21.5256 25.848 22.0659 26.2418C22.6062 26.6264 23.2701 26.8187 24.0577 26.8187Z"
        fill="#191A49"
      />
    </svg>
  )
}

export function IconGrow({ valid }: { valid?: boolean }) {
  return (
    <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="22.5" cy="22.5" r="22" fill="white" stroke="#191A49" />
      <path
        d="M24.5577 18.8187C25.4185 18.8187 26.2427 18.6264 27.0302 18.2418L27.1676 19.4505C26.3709 19.8168 25.4963 20 24.544 20C23.4176 20 22.4377 19.7024 21.6044 19.1071C20.7802 18.5119 20.217 17.6923 19.9148 16.6484H18.5V15.6319H19.7225C19.7042 15.3571 19.6951 15.1465 19.6951 15C19.6951 14.7527 19.7088 14.5147 19.7363 14.2857H18.5V13.2692H19.9423C20.2537 12.2527 20.826 11.456 21.6593 10.8791C22.4927 10.293 23.4725 10 24.5989 10C25.0659 10 25.5238 10.0504 25.9725 10.1511C26.4212 10.2518 26.8196 10.3892 27.1676 10.5632L27.0302 11.772C26.206 11.3782 25.391 11.1813 24.5852 11.1813C23.8068 11.1813 23.1474 11.369 22.6071 11.7445C22.076 12.1108 21.6822 12.619 21.4258 13.2692H25.4918V14.2857H21.1648C21.1374 14.5147 21.1236 14.7527 21.1236 15C21.1236 15.2106 21.1374 15.4212 21.1648 15.6319H25.4918V16.6484H21.3984C21.6364 17.3168 22.0256 17.848 22.5659 18.2418C23.1062 18.6264 23.7701 18.8187 24.5577 18.8187Z"
        fill="#191A49"
      />
      <path
        d="M7.68765 33.1096C7.47202 33.2821 7.43706 33.5967 7.60957 33.8123C7.78207 34.028 8.09672 34.0629 8.31235 33.8904L7.68765 33.1096ZM18 25.5L18.241 25.0619C18.0638 24.9645 17.8455 24.9833 17.6877 25.1096L18 25.5ZM28 31L27.759 31.4381C27.954 31.5453 28.1963 31.5109 28.3536 31.3536L28 31ZM38 21.5C38 21.2239 37.7761 21 37.5 21H33C32.7239 21 32.5 21.2239 32.5 21.5C32.5 21.7761 32.7239 22 33 22H37V26C37 26.2761 37.2239 26.5 37.5 26.5C37.7761 26.5 38 26.2761 38 26V21.5ZM8.31235 33.8904L18.3123 25.8904L17.6877 25.1096L7.68765 33.1096L8.31235 33.8904ZM17.759 25.9381L27.759 31.4381L28.241 30.5619L18.241 25.0619L17.759 25.9381ZM28.3536 31.3536L37.8536 21.8536L37.1464 21.1464L27.6464 30.6464L28.3536 31.3536Z"
        fill="#191A49"
      />
      <path d="M29 32L35.5 25.5" stroke="#191A49" strokeLinecap="round" />
      {valid === true && <SubIconValid />}
      {valid === false && <SubIconInvalid />}
    </svg>
  )
}
