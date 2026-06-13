import { type ReactNode, useEffect, useState } from "react";

/**
 * Renders children only after hydration. Used to gate browser-only widgets
 * (Monaco) and persisted-state-driven UI so SSR markup never diverges from
 * the client's localStorage-restored state.
 */
export function ClientOnly({
	children,
	fallback = null,
}: {
	children: ReactNode;
	fallback?: ReactNode;
}) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	return <>{mounted ? children : fallback}</>;
}
