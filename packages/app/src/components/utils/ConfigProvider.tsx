"use client";

import { createContext, type ReactNode } from "react";

export const ConfigContext = createContext({ isMonCompteProTest: false, isEmailLogin: false });
ConfigContext.displayName = "ConfigContext";

type ConfigType = {
  isEmailLogin: boolean;
  isMonCompteProTest: boolean;
};

type Props = {
  children: ReactNode;
  config: ConfigType;
};

export const ConfigProvider = ({ children, config }: Props) => {
  return <ConfigContext.Provider value={{ ...config }}>{children}</ConfigContext.Provider>;
};
