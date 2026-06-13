import type { CheckResult, Puzzle, RunResult } from "#/lib/puzzles/types";
import { parseJs } from "./ast";

/**
 * The core validation pipeline: parse the code once, then run every puzzle
 * check against the combined AST + runtime context.
 */
export function evaluatePuzzle(
	puzzle: Puzzle,
	code: string,
	run: RunResult,
): CheckResult[] {
	const { ast, parseError } = parseJs(code);
	const ctx = { code, ast, parseError, run };

	return puzzle.checks.map((check) => ({
		id: check.id,
		label: check.label,
		passed: safeValidate(check.validate, ctx),
	}));
}

function safeValidate(
	validate: Puzzle["checks"][number]["validate"],
	ctx: Parameters<Puzzle["checks"][number]["validate"]>[0],
): boolean {
	try {
		return validate(ctx);
	} catch {
		return false;
	}
}

/** Number of checks not yet passing — the "things to fix" counter. */
export function remainingFixes(results: CheckResult[]): number {
	return results.filter((r) => !r.passed).length;
}

export function isSolved(results: CheckResult[]): boolean {
	return results.length > 0 && results.every((r) => r.passed);
}
