import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./layout.module.css";

export default function AuthenticatedLayout({ children }) {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  );
}
