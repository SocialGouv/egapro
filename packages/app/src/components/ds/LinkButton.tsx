import { Flex, LinkBox, LinkOverlay, Spacer } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

export type LinkButtonProps = PropsWithChildren<{
  color?: string;
  href: string;
  isExternal?: boolean;
  leftIcon?: React.ReactNode;
}>;

export const LinkButton = ({
  children,
  color = "primary.500",
  href,
  isExternal = false,
  leftIcon = null,
  ...rest
}: LinkButtonProps) => {
  return (
    <LinkBox>
      <LinkOverlay href={href} isExternal={isExternal}>
        <Flex
          justify="center"
          align="center"
          border="1px solid"
          width="fit-content"
          px={3}
          py={2}
          borderRadius="lg"
          borderColor={color}
          margin="auto"
          {...rest}
        >
          {leftIcon}
          <Spacer ml={2} />
          {children}
        </Flex>
      </LinkOverlay>
    </LinkBox>
  );
};
