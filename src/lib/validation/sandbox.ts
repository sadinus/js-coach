import type { RunResult } from "#/lib/puzzles/types";

/** Identifies messages coming from our sandbox iframe. */
export const SANDBOX_SOURCE = "js-coach-sandbox";

/** Hard cap on execution before we tear the iframe down (catches infinite loops). */
export const RUN_TIMEOUT_MS = 3000;

export type SandboxMessage =
	| {
			source: typeof SANDBOX_SOURCE;
			type: "console";
			level: string;
			args: string[];
	  }
	| { source: typeof SANDBOX_SOURCE; type: "error"; message: string }
	| { source: typeof SANDBOX_SOURCE; type: "done" };

/**
 * Build the iframe document. User code runs inside a unique opaque origin
 * (sandbox="allow-scripts", no allow-same-origin) and talks to the host only
 * through postMessage.
 */
export function buildSrcDoc(code: string): string {
	// Prevent a literal </script> in user code from closing our injected block.
	const safeCode = code.replace(/<\/(script)/gi, "<\\/$1");
	return `<!doctype html>
<html>
<head><meta charset="utf-8" /></head>
<body>
<div id="root"></div>
<script>
(function () {
	var SOURCE = ${JSON.stringify(SANDBOX_SOURCE)};
	function send(msg) { msg.source = SOURCE; parent.postMessage(msg, "*"); }
	function format(v) {
		if (typeof v === "string") return v;
		if (v instanceof Error) return v.name + ": " + v.message;
		try { return JSON.stringify(v); } catch (e) { return String(v); }
	}
	["log", "info", "warn", "error"].forEach(function (level) {
		var orig = console[level] ? console[level].bind(console) : function () {};
		console[level] = function () {
			var args = Array.prototype.slice.call(arguments).map(format);
			send({ type: "console", level: level, args: args });
			orig.apply(null, arguments);
		};
	});
	window.addEventListener("error", function (e) {
		send({ type: "error", message: e.message });
	});
	window.addEventListener("unhandledrejection", function (e) {
		send({ type: "error", message: "Unhandled rejection: " + format(e.reason) });
	});
	try {
		${safeCode}
		send({ type: "done" });
	} catch (err) {
		send({ type: "error", message: format(err) });
		send({ type: "done" });
	}
})();
</script>
</body>
</html>`;
}

/** Build the initial RunResult accumulator. */
export function emptyRun(): RunResult {
	return { logs: [], error: null, timedOut: false };
}
