export const dynamic = "force-dynamic";
import "./global.css";
import style from "./root.module.scss";

const description =
  "Egapro permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression.";

export const metadata = {
  metadataBase: new URL(process.env.HOST || "http://localhost:3000"),
  description,
  title: {
    template: "Egapro - %s",
    default: "Egapro",
  },
  openGraph: {
    title: {
      template: "Egapro - %s",
      default: "Egapro",
    },
    description,
  },
  robots: "noindex, nofollow",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="fr" className={style.app}>
      <head>
        {/* <StartDsfr /> */}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
};

export default RootLayout;
