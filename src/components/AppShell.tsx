import { BottomNav } from "./BottomNav";
import { DesktopSideNav } from "./DesktopSideNav";
import { TopNav } from "./TopNav";

/** Wraps every page with Velnix navigation: top bar + desktop side nav + mobile bottom nav. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="desktop-shell">
      <TopNav />
      <DesktopSideNav />
      <main className="page">{children}</main>
      <BottomNav />
    </div>
  );
}
