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
import { getServerUser } from "@/lib/firebase/session";

export default async function Home() {
  const user = await getServerUser().catch(() => null);
  const signedIn = Boolean(user);

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
