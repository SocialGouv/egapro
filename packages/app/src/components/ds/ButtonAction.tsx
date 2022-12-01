import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";

export type ButtonProps = ChakraButtonProps & {
  colorScheme?: "gray" | "orange" | "primary";
  fullWidth?: boolean;
  label: string;
  leftIcon?: React.ReactElement;
  rightIcon?: React.ReactElement;
  size?: "lg" | "md" | "sm" | "xs";
  variant?: "ghost" | "link" | "outline" | "solid";
};

export type ButtonActionProps = ButtonProps & {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "reset" | "submit" | undefined;
};

export const ButtonAction = ({
  label,
  colorScheme = "primary",
  variant = "solid",
  onClick,
  leftIcon,
  rightIcon,
  type,
  size = "md",
  disabled = false,
  loading = false,
  fullWidth,
  ...rest
}: ButtonActionProps) => (
  <Button
    size={size}
    type={type}
    onClick={onClick}
    isDisabled={disabled}
    isLoading={loading}
    colorScheme={colorScheme}
    variant={variant}
    leftIcon={leftIcon}
    rightIcon={rightIcon}
    sx={{
      width: fullWidth ? "100%" : "auto",
    }}
    {...rest}
  >
    {label}
  </Button>
);
