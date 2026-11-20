import { logout } from "@/lib/auth/actions";
import type { Viewer } from "@/lib/auth/session";
import { stopEditHref, stopHref } from "@/lib/routes";
import styles from "./EditBar.module.css";
import { KeepScrollLink, RestoreScroll } from "./KeepScroll";

type Props = { viewer: Viewer; tripSlug: string; stopSlug: string };

/** Floating controls for signed-in editors reading a post: the way into edit mode, and log out. */
export function EditBar({ viewer, tripSlug, stopSlug }: Props) {
  return (
    <div className={styles.bar} role="region" aria-label="Editor controls">
      <RestoreScroll />
      <KeepScrollLink href={stopEditHref(tripSlug, stopSlug)} className={styles.edit}>
        Edit
      </KeepScrollLink>
      <span className={styles.divider} />
      <span className={styles.who} title={viewer.email}>
        {viewer.name}
      </span>
      <form action={logout}>
        <input type="hidden" name="next" value={stopHref(tripSlug, stopSlug)} />
        <button type="submit" className={styles.logout}>
          Log out
        </button>
      </form>
    </div>
  );
}
