/** @jsx jsx */
import {css, jsx} from "@emotion/core";
import {FC} from "react";
import {TEXT} from "./colors";


const Subtitle: FC = ({ children }) => (
  <p css={subtitleStyle}>
    {children}
  </p>
)

const subtitleStyle = css({
  fontFamily: "Open Sans",
  fontSize: "1em",
  color: TEXT
});

export default Subtitle;
