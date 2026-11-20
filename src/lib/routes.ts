export const homeHref = "/";
export const stateHref = (stateId: string) => `/states/${stateId}`;
export const stopHref = (tripSlug: string, stopSlug: string) => `/trips/${tripSlug}/${stopSlug}`;
export const stopEditHref = (tripSlug: string, stopSlug: string) => `${stopHref(tripSlug, stopSlug)}/edit`;

/** Widths each uploaded image is stored at. */
export const MEDIA_WIDTHS = [960, 2000] as const;
export const mediaFileName = (id: string, width: number) => `${id}-${width}.webp`;
export const mediaSrc = (id: string, width: number) => `/media/${mediaFileName(id, width)}`;
export const mediaSrcSet = (id: string) => MEDIA_WIDTHS.map((w) => `${mediaSrc(id, w)} ${w}w`).join(", ");

export type Route =
  | { kind: "india" }
  | { kind: "state"; stateId: string }
  | { kind: "blog"; tripSlug: string; stopSlug: string; edit: boolean }
  | { kind: "other" };

export function parseRoute(pathname: string): Route {
  if (pathname === "/") return { kind: "india" };
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts.length === 2 && parts[0] === "states") return { kind: "state", stateId: parts[1] };
  if (parts[0] === "trips" && (parts.length === 3 || (parts.length === 4 && parts[3] === "edit"))) {
    return { kind: "blog", tripSlug: parts[1], stopSlug: parts[2], edit: parts.length === 4 };
  }
  return { kind: "other" };
}
