import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import AuthGuard from "@/components/AuthGuard/AuthGuard";
import { ChatModalProvider } from "@/components/ChatModal/ChatModal";
import styles from "./layout.module.css";

export default function AuthenticatedLayout({ children }) {
  return (
    <ChatModalProvider>
      <div className={styles.shell}>
        <Header />
        <main className={styles.main}>
          <AuthGuard>{children}</AuthGuard>
        </main>
        <Footer />
      </div>
    </ChatModalProvider>
  );
}
