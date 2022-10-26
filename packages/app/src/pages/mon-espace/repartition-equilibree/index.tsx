import { useRouter } from "next/router";
import { useForm } from "react-hook-form";

import type { NextPageWithLayout } from "../../_app";
import { RepartitionEquilibreeStartLayout } from "@components/layouts/RepartitionEquilibreeStartLayout";
import {
  FormButton,
  FormGroup,
  FormGroupLabel,
  FormInput,
  FormLayout,
  FormLayoutButtonGroup,
  FormSelect,
} from "@design-system";
import { useUser } from "@services/apiClient";

const title = "Recherche de répartition équilibrée";

type FormType = { siren: string; year: string };

const RepartitionEquilibreeListPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { user } = useUser({ redirectTo: "/ecart-rep/email" });
  const { register, handleSubmit } = useForm<FormType>({});

  // TODO: problème avec ce contrôle. Au début, user est vide donc user.staff ne peut pas être donné, mais ça ne veut pas dire qu'il ne sera pas à true plus tard...
  // useEffect(() => {
  //   if (!user?.staff) router.push("/ecart-rep/email");
  // }, [user?.staff, router]);

  const onSubmit = (data: FormType) => {
    const { siren, year } = data;

    router.push(`./repartition-equilibree/${siren}/${year}`);
  };

  return (
    <>
      <h1>{title}</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormLayout>
          <FormGroup>
            <FormGroupLabel htmlFor="year">Année</FormGroupLabel>
            <FormSelect id="year" {...register("year")}>
              <option value="2021">2021</option>
            </FormSelect>
          </FormGroup>
          <FormGroup>
            <FormGroupLabel htmlFor="siren" hint="9 chiffres">
              Numéro Siren de l'entreprise
            </FormGroupLabel>
            <FormInput
              id="siren"
              placeholder="Ex: 504920166, 403461742, 403696735, 914458799"
              type="text"
              {...register("siren")}
              maxLength={9}
            />
          </FormGroup>
          <FormLayoutButtonGroup>
            <FormButton>Rechercher</FormButton>
          </FormLayoutButtonGroup>
        </FormLayout>
      </form>
    </>
  );
};

RepartitionEquilibreeListPage.getLayout = ({ children }) => {
  return <RepartitionEquilibreeStartLayout>{children}</RepartitionEquilibreeStartLayout>;
};

export default RepartitionEquilibreeListPage;
