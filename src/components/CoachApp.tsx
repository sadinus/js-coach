import { CheckCircle2, Circle, Lightbulb, Play, RotateCcw } from "lucide-react";
import { getPuzzle } from "#/lib/puzzles/data";
import type { ConsoleEntry } from "#/lib/puzzles/types";
import { isSolved, remainingFixes, useEngine } from "#/store/engine";
import { CodeEditor } from "./CodeEditor";
import { SandboxRunner } from "./SandboxRunner";

export function CoachApp() {
	const puzzleId = useEngine((s) => s.puzzleId);
	const code = useEngine((s) => s.code);
	const status = useEngine((s) => s.status);
	const runId = useEngine((s) => s.runId);
	const runResult = useEngine((s) => s.runResult);
	const checkResults = useEngine((s) => s.checkResults);
	const hintsRevealed = useEngine(
		(s) => s.hintsRevealedByPuzzle[s.puzzleId] ?? 0,
	);
	const setCode = useEngine((s) => s.setCode);
	const requestRun = useEngine((s) => s.requestRun);
	const completeRun = useEngine((s) => s.completeRun);
	const resetCode = useEngine((s) => s.resetCode);
	const showSolution = useEngine((s) => s.showSolution);
	const revealHint = useEngine((s) => s.revealHint);

	const puzzle = getPuzzle(puzzleId);
	if (!puzzle) return <div className="p-8">Unknown puzzle: {puzzleId}</div>;

	const remaining = remainingFixes(checkResults);
	const solved = isSolved(checkResults);
	const hasRun = checkResults.length > 0;

	return (
		<div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
			<header className="flex items-center justify-between border-zinc-800 border-b px-5 py-3">
				<div className="flex items-baseline gap-3">
					<h1 className="font-semibold text-lg">JS Coach</h1>
					<span className="text-sm text-zinc-400">{puzzle.title}</span>
				</div>
				<span className="text-sm text-zinc-400">
					{hasRun ? (
						solved ? (
							<span className="font-medium text-emerald-400">Solved! 🎉</span>
						) : (
							<span>
								{remaining} {remaining === 1 ? "thing" : "things"} to fix
							</span>
						)
					) : (
						<span>Run your code to check it</span>
					)}
				</span>
			</header>

			<div className="grid min-h-0 flex-1 grid-cols-2">
				{/* Editor + toolbar */}
				<section className="flex min-h-0 flex-col border-zinc-800 border-r">
					<div className="flex items-center gap-2 border-zinc-800 border-b px-3 py-2">
						<button
							type="button"
							onClick={requestRun}
							disabled={status === "running"}
							className="flex items-center gap-1.5 rounded bg-emerald-600 px-3 py-1.5 font-medium text-sm text-white hover:bg-emerald-500 disabled:opacity-50"
						>
							<Play size={14} />
							{status === "running" ? "Running…" : "Run & Check"}
						</button>
						<button
							type="button"
							onClick={resetCode}
							className="flex items-center gap-1.5 rounded border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
						>
							<RotateCcw size={14} />
							Reset
						</button>
						<button
							type="button"
							onClick={showSolution}
							className="ml-auto rounded px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-100"
						>
							Show solution
						</button>
					</div>
					<div className="min-h-0 flex-1">
						<CodeEditor
							value={code}
							language={puzzle.language}
							onChange={setCode}
						/>
					</div>
				</section>

				{/* Right rail: tasks, console, preview */}
				<section className="flex min-h-0 flex-col">
					<div className="min-h-0 flex-1 overflow-auto p-4">
						<p className="text-sm text-zinc-300 leading-relaxed">
							{puzzle.description}
						</p>

						<h2 className="mt-5 font-semibold text-xs text-zinc-500 uppercase tracking-wide">
							Tasks
						</h2>
						<ul className="mt-2 space-y-1.5">
							{puzzle.checks.map((check) => {
								const result = checkResults.find((r) => r.id === check.id);
								const passed = result?.passed ?? false;
								return (
									<li key={check.id} className="flex items-start gap-2 text-sm">
										{passed ? (
											<CheckCircle2
												size={16}
												className="mt-0.5 shrink-0 text-emerald-400"
											/>
										) : (
											<Circle
												size={16}
												className="mt-0.5 shrink-0 text-zinc-600"
											/>
										)}
										<span
											className={passed ? "text-zinc-400 line-through" : ""}
										>
											{check.label}
										</span>
									</li>
								);
							})}
						</ul>

						<HintsSection
							hints={puzzle.hints}
							revealed={hintsRevealed}
							onReveal={revealHint}
						/>
					</div>

					<ConsolePanel result={runResult} status={status} />

					<div className="h-32 shrink-0 border-zinc-800 border-t">
						<SandboxRunner code={code} runId={runId} onResult={completeRun} />
					</div>
				</section>
			</div>
		</div>
	);
}

function HintsSection({
	hints,
	revealed,
	onReveal,
}: {
	hints: string[];
	revealed: number;
	onReveal: () => void;
}) {
	return (
		<div className="mt-6">
			<h2 className="font-semibold text-xs text-zinc-500 uppercase tracking-wide">
				Hints
			</h2>
			<ol className="mt-2 space-y-2">
				{hints.slice(0, revealed).map((hint, i) => (
					<li
						// biome-ignore lint/suspicious/noArrayIndexKey: hints are a static ordered list
						key={i}
						className="rounded border border-amber-900/40 bg-amber-950/30 px-3 py-2 text-amber-100/90 text-sm"
					>
						{hint}
					</li>
				))}
			</ol>
			{revealed < hints.length && (
				<button
					type="button"
					onClick={onReveal}
					className="mt-2 flex items-center gap-1.5 text-amber-400 text-sm hover:text-amber-300"
				>
					<Lightbulb size={14} />
					{revealed === 0 ? "Show a hint" : "Show another hint"}
				</button>
			)}
		</div>
	);
}

function ConsolePanel({
	result,
	status,
}: {
	result: { logs: ConsoleEntry[]; error: string | null } | null;
	status: string;
}) {
	const levelColor: Record<string, string> = {
		log: "text-zinc-200",
		info: "text-sky-300",
		warn: "text-amber-300",
		error: "text-red-400",
	};
	return (
		<div className="h-40 shrink-0 overflow-auto border-zinc-800 border-t bg-black/40 p-3 font-mono text-xs">
			<div className="mb-1 text-[10px] text-zinc-500 uppercase tracking-wide">
				Console
			</div>
			{status === "running" && <div className="text-zinc-500">Running…</div>}
			{result?.logs.map((entry, i) => (
				<div
					// biome-ignore lint/suspicious/noArrayIndexKey: append-only log stream
					key={i}
					className={levelColor[entry.level] ?? "text-zinc-200"}
				>
					{entry.args.join(" ")}
				</div>
			))}
			{result?.error && <div className="text-red-400">⚠ {result.error}</div>}
			{status === "done" && !result?.logs.length && !result?.error && (
				<div className="text-zinc-600">(no output)</div>
			)}
		</div>
	);
}
