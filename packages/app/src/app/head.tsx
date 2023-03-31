import "./StartDsfr";

import { DsfrHead } from "@codegouvfr/react-dsfr/next-appdir/DsfrHead";

import { defaultColorScheme } from "./defaultColorScheme";

const RootHead = () => (
  <head>
    <DsfrHead defaultColorScheme={defaultColorScheme} />
  </head>
);

export default RootHead;
