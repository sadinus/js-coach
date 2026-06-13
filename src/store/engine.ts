import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { defaultPuzzle, getPuzzle } from "#/lib/puzzles/data";
import type { CheckResult, RunResult } from "#/lib/puzzles/types";
import {
	evaluatePuzzle,
	isSolved,
	remainingFixes,
} from "#/lib/validation/evaluate";

export type RunStatus = "idle" | "running" | "done";

interface EngineState {
	puzzleId: string;
	/** Live editor contents for the active puzzle. */
	code: string;
	/** Persisted per-puzzle code so progress survives reloads. */
	codeByPuzzle: Record<string, string>;
	/** Persisted count of revealed hints per puzzle. */
	hintsRevealedByPuzzle: Record<string, number>;

	// Transient run state (never persisted).
	status: RunStatus;
	/** Bumped to ask the <SandboxRunner> to execute the current code. */
	runId: number;
	runResult: RunResult | null;
	checkResults: CheckResult[];

	setCode: (code: string) => void;
	selectPuzzle: (id: string) => void;
	resetCode: () => void;
	showSolution: () => void;
	revealHint: () => void;
	requestRun: () => void;
	completeRun: (run: RunResult) => void;
}

function codeFor(id: string, stored: Record<string, string>): string {
	return stored[id] ?? getPuzzle(id)?.initialCode ?? "";
}

export const useEngine = create<EngineState>()(
	persist(
		(set, get) => ({
			puzzleId: defaultPuzzle.id,
			code: defaultPuzzle.initialCode,
			codeByPuzzle: {},
			hintsRevealedByPuzzle: {},

			status: "idle",
			runId: 0,
			runResult: null,
			checkResults: [],

			setCode: (code) =>
				set((s) => ({
					code,
					codeByPuzzle: { ...s.codeByPuzzle, [s.puzzleId]: code },
				})),

			selectPuzzle: (id) =>
				set((s) => ({
					puzzleId: id,
					code: codeFor(id, s.codeByPuzzle),
					status: "idle",
					runResult: null,
					checkResults: [],
				})),

			resetCode: () => {
				const puzzle = getPuzzle(get().puzzleId);
				if (!puzzle) return;
				set((s) => ({
					code: puzzle.initialCode,
					codeByPuzzle: {
						...s.codeByPuzzle,
						[s.puzzleId]: puzzle.initialCode,
					},
					status: "idle",
					runResult: null,
					checkResults: [],
				}));
			},

			showSolution: () => {
				const puzzle = getPuzzle(get().puzzleId);
				if (!puzzle) return;
				set((s) => ({
					code: puzzle.solution,
					codeByPuzzle: { ...s.codeByPuzzle, [s.puzzleId]: puzzle.solution },
				}));
			},

			revealHint: () =>
				set((s) => {
					const puzzle = getPuzzle(s.puzzleId);
					const max = puzzle?.hints.length ?? 0;
					const current = s.hintsRevealedByPuzzle[s.puzzleId] ?? 0;
					return {
						hintsRevealedByPuzzle: {
							...s.hintsRevealedByPuzzle,
							[s.puzzleId]: Math.min(current + 1, max),
						},
					};
				}),

			requestRun: () => set((s) => ({ status: "running", runId: s.runId + 1 })),

			completeRun: (run) =>
				set((s) => {
					const puzzle = getPuzzle(s.puzzleId);
					const checkResults = puzzle
						? evaluatePuzzle(puzzle, s.code, run)
						: [];
					return { status: "done", runResult: run, checkResults };
				}),
		}),
		{
			name: "js-coach-engine",
			storage: createJSONStorage(() =>
				typeof window !== "undefined" ? window.localStorage : memoryStorage,
			),
			// Only persist progress; run state is recomputed each session.
			partialize: (s) => ({
				puzzleId: s.puzzleId,
				codeByPuzzle: s.codeByPuzzle,
				hintsRevealedByPuzzle: s.hintsRevealedByPuzzle,
			}),
			// Restore the live `code` field from the persisted per-puzzle map.
			onRehydrateStorage: () => (state) => {
				if (state) state.code = codeFor(state.puzzleId, state.codeByPuzzle);
			},
		},
	),
);

export { remainingFixes, isSolved };

/** No-op storage used during SSR where localStorage is unavailable. */
const memoryStorage: Storage = {
	length: 0,
	clear: () => {},
	getItem: () => null,
	key: () => null,
	removeItem: () => {},
	setItem: () => {},
};
