import { type NextServerPageProps } from "@common/utils/next";

const ConsulterIndexRecherche = ({ searchParams }: NextServerPageProps<"", "q">) => {
  return <>q={searchParams.q}</>;
};

export default ConsulterIndexRecherche;
