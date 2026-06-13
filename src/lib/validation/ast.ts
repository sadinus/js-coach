import type { Node } from "acorn";
import { parse } from "acorn";
import { type AncestorVisitors, ancestor } from "acorn-walk";

export interface ParseOutput {
	ast: Node | null;
	parseError: string | null;
}

/** Parse JS source as a module, tolerating top-level returns/awaits. */
export function parseJs(code: string): ParseOutput {
	try {
		const ast = parse(code, {
			ecmaVersion: "latest",
			sourceType: "module",
			allowReturnOutsideFunction: true,
			allowAwaitOutsideFunction: true,
		});
		return { ast, parseError: null };
	} catch (err) {
		return {
			ast: null,
			parseError: err instanceof Error ? err.message : String(err),
		};
	}
}

/** True when any node in the tree matches one of the visited node types. */
export function hasNodeType(
	ast: Node | null,
	visitors: AncestorVisitors<{ found: boolean }>,
): boolean {
	if (!ast) return false;
	const state = { found: false };
	ancestor(ast, visitors, undefined, state);
	return state.found;
}

/** Optional chaining (`a?.b`) — acorn wraps these in a ChainExpression. */
export function usesOptionalChaining(ast: Node | null): boolean {
	return hasNodeType(ast, {
		ChainExpression(_n, state) {
			state.found = true;
		},
	});
}

/** Nullish coalescing (`a ?? b`). */
export function usesNullishCoalescing(ast: Node | null): boolean {
	return hasNodeType(ast, {
		// biome-ignore lint/suspicious/noExplicitAny: acorn node shape
		LogicalExpression(node: any, state) {
			if (node.operator === "??") state.found = true;
		},
	});
}

/** Template literals (backtick strings, with or without interpolation). */
export function usesTemplateLiteral(ast: Node | null): boolean {
	return hasNodeType(ast, {
		TemplateLiteral(_n, state) {
			state.found = true;
		},
	});
}

/** async/await — either an async function or a bare await expression. */
export function usesAsyncAwait(ast: Node | null): boolean {
	return hasNodeType(ast, {
		AwaitExpression(_n, state) {
			state.found = true;
		},
		// biome-ignore lint/suspicious/noExplicitAny: acorn node shape
		Function(node: any, state) {
			if (node.async) state.found = true;
		},
	});
}

/** True when the code declares anything with `var`. */
export function usesVar(ast: Node | null): boolean {
	return hasNodeType(ast, {
		// biome-ignore lint/suspicious/noExplicitAny: acorn node shape
		VariableDeclaration(node: any, state) {
			if (node.kind === "var") state.found = true;
		},
	});
}
