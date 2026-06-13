import type { Node } from "acorn";

/** Languages the engine can run/validate. Only "js" is wired up in the MVP. */
export type Language = "js" | "ts" | "tsx";

/** Free-form concept tags so the puzzle list can be filtered/sampled later. */
export type Tag = "es-syntax" | "react" | "ts-utility-types";

export type ConsoleLevel = "log" | "info" | "warn" | "error";

export interface ConsoleEntry {
	level: ConsoleLevel;
	/** Pre-formatted argument strings (formatting happens inside the sandbox). */
	args: string[];
}

/** Outcome of executing the user's code in the sandbox. */
export interface RunResult {
	logs: ConsoleEntry[];
	/** Runtime error message, or null when the code ran cleanly. */
	error: string | null;
	/** True when execution was aborted by the runner's timeout. */
	timedOut: boolean;
}

/** Everything a check needs to make a pass/fail decision. */
export interface ValidationContext {
	code: string;
	/** Parsed ESTree program, or null when the code failed to parse. */
	ast: Node | null;
	parseError: string | null;
	run: RunResult;
}

/**
 * A single "thing to fix". The remaining-fixes counter is the number of checks
 * whose `validate` currently returns false.
 */
export interface Check {
	id: string;
	label: string;
	validate: (ctx: ValidationContext) => boolean;
}

export interface CheckResult {
	id: string;
	label: string;
	passed: boolean;
}

/** Puzzles are data, not code — adding a puzzle is adding a record. */
export interface Puzzle {
	id: string;
	title: string;
	description: string;
	language: Language;
	tags: Tag[];
	initialCode: string;
	/** Reference solution, used for the "show solution" affordance. */
	solution: string;
	/** Progressive, pre-authored hints. */
	hints: string[];
	checks: Check[];
}
