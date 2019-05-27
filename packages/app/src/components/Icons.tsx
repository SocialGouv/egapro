/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Fragment, ReactNode } from "react";

export function IconValid() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
    >
      <circle cx="5.5" cy="5.5" r="4.5" />
      <path
        d="M3.27783 7.72228L7.72228 3.27783M3.27783 3.27783L7.72228 7.72228"
        strokeLinecap="round"
      />
    </svg>
  );
}
