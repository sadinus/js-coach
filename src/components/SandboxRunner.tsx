import { useEffect, useRef } from "react";
import type { ConsoleLevel, RunResult } from "#/lib/puzzles/types";
import {
	buildSrcDoc,
	emptyRun,
	RUN_TIMEOUT_MS,
	SANDBOX_SOURCE,
	type SandboxMessage,
} from "#/lib/validation/sandbox";

interface SandboxRunnerProps {
	code: string;
	/** Bump this to (re)execute `code`. A value of 0 means "don't run yet". */
	runId: number;
	onResult: (result: RunResult) => void;
}

const CONSOLE_LEVELS: ConsoleLevel[] = ["log", "info", "warn", "error"];

function isConsoleLevel(level: string): level is ConsoleLevel {
	return (CONSOLE_LEVELS as string[]).includes(level);
}

/**
 * Renders the sandboxed iframe (which doubles as the DOM preview) and, whenever
 * `runId` changes, executes the code and reports the collected logs/errors.
 */
export function SandboxRunner({ code, runId, onResult }: SandboxRunnerProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	// Latest props read at run time so only `runId` drives re-execution.
	const codeRef = useRef(code);
	const onResultRef = useRef(onResult);
	codeRef.current = code;
	onResultRef.current = onResult;

	useEffect(() => {
		if (runId === 0) return;
		const iframe = iframeRef.current;
		if (!iframe) return;

		const run = emptyRun();
		let settled = false;

		const finish = () => {
			if (settled) return;
			settled = true;
			window.removeEventListener("message", onMessage);
			clearTimeout(timer);
			onResultRef.current(run);
		};

		const onMessage = (event: MessageEvent) => {
			// Ignore anything not from this iframe / not our protocol.
			if (event.source !== iframe.contentWindow) return;
			const data = event.data as SandboxMessage;
			if (!data || data.source !== SANDBOX_SOURCE) return;

			if (data.type === "console" && isConsoleLevel(data.level)) {
				run.logs.push({ level: data.level, args: data.args });
			} else if (data.type === "error") {
				if (!run.error) run.error = data.message;
			} else if (data.type === "done") {
				finish();
			}
		};

		const timer = setTimeout(() => {
			run.timedOut = true;
			if (!run.error)
				run.error = `Execution timed out after ${RUN_TIMEOUT_MS}ms`;
			finish();
		}, RUN_TIMEOUT_MS);

		window.addEventListener("message", onMessage);
		iframe.srcdoc = buildSrcDoc(codeRef.current);

		return () => {
			window.removeEventListener("message", onMessage);
			clearTimeout(timer);
		};
	}, [runId]);

	return (
		<iframe
			ref={iframeRef}
			title="Sandbox preview"
			sandbox="allow-scripts"
			className="h-full w-full border-0 bg-white"
		/>
	);
}
