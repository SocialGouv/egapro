import type { BoxProps } from "@chakra-ui/react";
import { Box, keyframes } from "@chakra-ui/react";
import type { FunctionComponent } from "react";

export interface ActivityIndicatorProps {
  color?: string;
  size?: number;
}

const Pills = (props: BoxProps) => (
  <Box position="absolute" top="0" left="0" right="0" bottom="0" borderRadius="full" opacity={0.6} {...props} />
);

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
});

export const ActivityIndicator: FunctionComponent<ActivityIndicatorProps> = ({ size = 6, color = "primary.500" }) => {
  const pillsAnimation = `${bounce} 2.0s infinite ease-in-out`;
  return (
    <Box position="relative" height={size} width={size}>
      <Pills bg={color} animation={pillsAnimation} />
      <Pills bg={color} animation={pillsAnimation} sx={{ animationDelay: "-1.0s" }} />
    </Box>
  );
};
