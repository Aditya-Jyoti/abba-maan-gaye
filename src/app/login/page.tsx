import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { safeNext } from "@/lib/auth/redirect.mjs";
import { getViewer } from "@/lib/auth/session";
import { site } from "@/lib/site";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: `Log in | ${site.name}`,
  robots: { index: false },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.tape} />
        <svg viewBox="-60 -60 120 120" width="72" height="72" aria-hidden className={styles.compass}>
          <circle r="38" fill="#fffdf7" stroke="#3d2c22" strokeWidth="1.2" />
          <circle r="30" fill="none" stroke="#3d2c22" strokeWidth=".7" strokeDasharray="1.5 3" />
          <path d="M0,-28 L5,0 L0,28 L-5,0 Z" fill="#c4532f" stroke="#3d2c22" strokeWidth=".9" />
          <path d="M-28,0 L0,-5 L28,0 L0,5 Z" fill="#e9cf9a" stroke="#3d2c22" strokeWidth=".9" />
          <circle r="3.2" fill="#fffaf0" stroke="#3d2c22" strokeWidth=".9" />
        </svg>
        <h1 className={styles.title}>Editor login</h1>
        <p className={styles.lede}>For the people who write {site.name}.</p>
        <Suspense>
          <Form searchParams={searchParams} />
        </Suspense>
        <Link href="/" className={styles.back}>
          Back to the map
        </Link>
      </div>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = safeNext((await searchParams).next);
  if (await getViewer()) redirect(next);
  return <LoginForm next={next} />;
}
