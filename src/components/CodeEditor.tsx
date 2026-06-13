import Editor from "@monaco-editor/react";
import type { Language } from "#/lib/puzzles/types";

const MONACO_LANGUAGE: Record<Language, string> = {
	js: "javascript",
	ts: "typescript",
	tsx: "typescript",
};

interface CodeEditorProps {
	value: string;
	language: Language;
	onChange: (value: string) => void;
}

export function CodeEditor({ value, language, onChange }: CodeEditorProps) {
	return (
		<Editor
			value={value}
			language={MONACO_LANGUAGE[language]}
			theme="vs-dark"
			onChange={(next) => onChange(next ?? "")}
			loading={<div className="p-4 text-sm text-zinc-400">Loading editor…</div>}
			options={{
				fontSize: 14,
				minimap: { enabled: false },
				scrollBeyondLastLine: false,
				tabSize: 2,
				automaticLayout: true,
				padding: { top: 12 },
			}}
		/>
	);
}
