"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";
import styles from "./login.module.css";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <label className={styles.field}>
        <span>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          key={state.email}
          autoFocus
        />
      </label>
      <label className={styles.field}>
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className={styles.submit} disabled={pending}>
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
