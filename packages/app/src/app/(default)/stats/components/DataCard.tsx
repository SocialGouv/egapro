import styles from "./DataCard.module.scss";

export type DataCardProps = {
  data: React.ReactNode;
  title: string;
};

export const DataCard = ({ title, data }: DataCardProps) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.data}>{data}</div>
    </div>
  );
};
