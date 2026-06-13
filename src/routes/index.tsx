import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "#/components/ClientOnly";
import { CoachApp } from "#/components/CoachApp";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<ClientOnly
			fallback={
				<div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
					Loading JS Coach…
				</div>
			}
		>
			<CoachApp />
		</ClientOnly>
	);
}
