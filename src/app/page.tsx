import { Hero } from "@/features/landing/hero";
import { LandingTopBar, PillNav } from "@/features/landing/landing-nav";
import {
  Disc,
  Expectations,
  FeatureRows,
  JoinClose,
  LandingFooter,
  Marquee,
  Setlist,
  Statement,
} from "@/features/landing/sections";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/route-guard";

export default async function Home() {
  // The landing page only needs to know which door to point at, so it reads the cookie rather
  // than verifying it. That keeps the public page independent of the admin SDK and its
  // credentials; every page behind the door still verifies for real.
  const jar = await cookies();
  const signedIn = Boolean(jar.get(SESSION_COOKIE_NAME)?.value);

  return (
    <div className="relative">
      <LandingTopBar signedIn={signedIn} />
      <main className="flex-1">
        <Hero signedIn={signedIn} />
        <Statement />
        <Setlist />
        <Marquee />
        <FeatureRows />
        <Disc />
        <Expectations />
        <JoinClose signedIn={signedIn} />
      </main>
      <LandingFooter />
      <PillNav signedIn={signedIn} />
    </div>
  );
}
