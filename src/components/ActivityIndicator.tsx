/** @jsxImportSource @emotion/react */
import { css, keyframes } from "@emotion/react"

interface Props {
  size?: number
  color?: string
}

function ActivityIndicator({ size = 25, color = "#FFF" }: Props) {
  return (
    <div css={[stylesActivity.container, { width: size, height: size }]}>
      <div css={[stylesActivity.round, { backgroundColor: color }]} />
      <div css={[stylesActivity.round, stylesActivity.round2, { backgroundColor: color }]} />
    </div>
  )
}

const bounce = keyframes({
  "0%": {
    transform: "scale(0)",
  },
  "50%": {
    transform: "scale(1)",
  },
  "100%": {
    transform: "scale(0)",
  },
})

const stylesActivity = {
  container: css({
    position: "relative",
  }),
  round: css({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    borderRadius: "50%",
    opacity: 0.6,
    animation: `${bounce} 2.0s infinite ease-in-out`,
  }),
  round2: css({
    animationDelay: "-1.0s",
  }),
}

export default ActivityIndicator
