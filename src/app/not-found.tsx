import Link from "next/link";

import { AppShell } from "@/components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="container">
        <div className="state-box mt24">
          <div className="ic">✦</div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>404</h1>
          <p className="muted">This page drifted out of the Velnix multiverse.</p>
          <Link className="btn btn-primary btn-sm mt8" href="/">
            Back to Home
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
