import { describe, expect, it } from "vitest";
import { defaultPuzzle } from "#/lib/puzzles/data";
import type { RunResult } from "#/lib/puzzles/types";
import { evaluatePuzzle, isSolved, remainingFixes } from "./evaluate";

const cleanRun: RunResult = {
	logs: [
		{ level: "log", args: ["Ada lives in London"] },
		{ level: "log", args: ["Linus lives in Unknown"] },
	],
	error: null,
	timedOut: false,
};

function byId(code: string, run: RunResult) {
	const results = evaluatePuzzle(defaultPuzzle, code, run);
	return Object.fromEntries(results.map((r) => [r.id, r.passed]));
}

describe("evaluatePuzzle / modernize-access", () => {
	it("passes every check for the reference solution", () => {
		const results = evaluatePuzzle(
			defaultPuzzle,
			defaultPuzzle.solution,
			cleanRun,
		);
		expect(isSolved(results)).toBe(true);
		expect(remainingFixes(results)).toBe(0);
	});

	it("fails the syntax checks for the legacy starting code", () => {
		const checks = byId(defaultPuzzle.initialCode, cleanRun);
		expect(checks["optional-chaining"]).toBe(false);
		expect(checks["nullish-coalescing"]).toBe(false);
		expect(checks["template-literal"]).toBe(false);
		expect(checks["no-var"]).toBe(false);
	});

	it("detects each modern construct individually", () => {
		// biome-ignore lint/suspicious/noTemplateCurlyInString: this string IS source code under test
		const code = "const x = a?.b ?? `hi ${name}`;";
		const checks = byId(code, cleanRun);
		expect(checks["optional-chaining"]).toBe(true);
		expect(checks["nullish-coalescing"]).toBe(true);
		expect(checks["template-literal"]).toBe(true);
		expect(checks["no-var"]).toBe(true);
	});

	it("fails the runtime check on error or timeout", () => {
		const errored: RunResult = { logs: [], error: "boom", timedOut: false };
		expect(byId(defaultPuzzle.solution, errored)["runs-clean"]).toBe(false);
		const timedOut: RunResult = { logs: [], error: null, timedOut: true };
		expect(byId(defaultPuzzle.solution, timedOut)["runs-clean"]).toBe(false);
	});

	it("requires both expected output lines", () => {
		const partial: RunResult = {
			logs: [{ level: "log", args: ["Ada lives in London"] }],
			error: null,
			timedOut: false,
		};
		expect(byId(defaultPuzzle.solution, partial)["correct-output"]).toBe(false);
	});

	it("treats unparseable code as failing the AST checks", () => {
		const checks = byId("const x = (((", cleanRun);
		expect(checks["optional-chaining"]).toBe(false);
		expect(checks["no-var"]).toBe(false);
	});
});
