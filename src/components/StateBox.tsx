"use client";

/** Reusable empty / error / loading state with an optional retry button. */
export function StateBox({
  icon = "✦",
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="state-box fade-in">
      <div className="ic">{icon}</div>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <StateBox
      icon="⚠"
      title="Something went wrong"
      message={message}
      action={onRetry ? <button className="btn btn-ghost btn-sm" onClick={onRetry}>Retry</button> : null}
    />
  );
}

export function EmptyBox({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return <StateBox icon="✦" title={title} message={message} action={action} />;
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="state-box" style={{ background: "transparent", border: "none" }}>
      <div className="spinner" style={{ margin: "0 auto" }} />
      <p className="muted mt12">{label}…</p>
    </div>
  );
}
