import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1>404</h1>
      <p>Cette page est introuvable.</p>
      <Link href="/">Retour à la connexion</Link>
    </main>
  );
}
