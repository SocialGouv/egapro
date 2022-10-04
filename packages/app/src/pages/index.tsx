import Image from "next/image";
import Link from "next/link";

import picture from "../../public/picture-1.svg";
import type { NextPageWithLayout } from "./_app";
import { BasicLayout } from "@components/layouts/BasicLayout";

const Home: NextPageWithLayout = () => {
  return (
    <section>
      <div className="bg-grey-975 fr-py-10w">
        <div className="fr-container">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-lg-7 fr-col-12">
              <h1 className="fr-h1">Bienvenue sur Egapro</h1>
              <p className="fr-text--md">
                Toutes les entreprises d’au moins 50 salariés doivent calculer et publier leur Index de l’égalité
                professionnelle entre les femmes et les hommes, chaque année au plus tard le 1er mars.
              </p>
              <p className="fr-text--md">
                Les entreprises qui emploient au moins 1 000 salariés pour le troisième exercice consécutif doivent
                également calculer et publier leurs écarts éventuels de représentation entre les femmes et les hommes
                parmi leurs cadres dirigeants et les membres de leurs instances dirigeantes, chaque année au plus tard
                le 1er mars.
              </p>
            </div>
            <div className="fr-col-lg-5 fr-col-12">
              <Image src={picture} alt="" layout="responsive" />
            </div>
          </div>
        </div>
      </div>
      <div className="fr-container">
        <div className="fr-pb-8w">
          <div className="fr-grid-row fr-grid-row--gutters">
            <div className="fr-col-md-6 fr-col-12">
              <div className="fr-card fr-card--sm">
                <div className="fr-card__body fr-card__start">
                  <div className="fr-card__content">
                    <h2 className="fr-card__title">Index de l'égalité professionnelle femmes-hommes</h2>
                    <div className="fr-card__desc">
                      <div>
                        Calculer et/ou déclarer votre index de l'égalité professionnelle entre les femmes et les hommes.
                      </div>
                      <div className="fr-mt-2v">
                        <a href="#" target="_self" className="ds-link ds-text-sm ds-fr--inline fr-link--md">
                          Pour plus d'informations sur l'index Egapro
                          <span
                            className="ri-sm icon-right ds-fr--v-middle ri-arrow-right-line"
                            aria-hidden="true"
                          ></span>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="fr-card__footer">
                    <ul className="fr-btns-group fr-btns-group--inline-null fr-btns-group--equisized">
                      <li>
                        <Link href="/index">
                          <a className="fr-btn">Calculer - Déclarer mon Index</a>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="fr-col-md-6 fr-col-12">
              <div className="fr-card fr-card--sm">
                <div className="fr-card__body fr-card__start">
                  <div className="fr-card__content">
                    <h2 className="fr-card__title">Répartition équilibrée femmes-hommes</h2>
                    <div className="fr-card__desc">
                      <div>
                        Déclarer vos écarts de représentation entre les femmes et les hommes dans les postes de
                        direction.
                      </div>
                      <div className="fr-mt-2v">
                        <Link href="/ecart-rep">
                          <a className="ds-link ds-text-sm ds-fr--inline fr-link--md">
                            Pour plus d'informations sur la répartition équilibrée
                            <span
                              className="ri-sm icon-right ds-fr--v-middle ri-arrow-right-line"
                              aria-hidden="true"
                            ></span>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="fr-card__footer">
                    <ul className="fr-btns-group fr-btns-group--inline-null fr-btns-group--equisized">
                      <li>
                        <Link href="/ecart-rep">
                          <a className="fr-btn">Déclarer mes Écarts</a>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

Home.getLayout = ({ children }) => {
  return <BasicLayout>{children}</BasicLayout>;
};

export default Home;
