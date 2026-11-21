import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { stateById } from "@/lib/map";

const STATE_PAGE = /^\/states\/([^/]+)\/?$/;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A state that isn't on the map can't have trips. The page would notice too, but only
  // after the response has started (Cache Components sends the shell first), so the status
  // would stay 200. Rewriting to a path no route matches gives a real 404 instead.
  const state = STATE_PAGE.exec(pathname);
  if (state) {
    return stateById.has(decodeURIComponent(state[1]))
      ? NextResponse.next()
      : NextResponse.rewrite(new URL("/_not-found-state", request.url));
  }

  // Quick check before edit pages render: no session cookie, straight to the login page.
  // The pages still verify the session against the database themselves.
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/states/:stateId", "/trips/:tripSlug/:stopSlug/edit"],
};
