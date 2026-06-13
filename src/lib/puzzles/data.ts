import {
	usesNullishCoalescing,
	usesOptionalChaining,
	usesTemplateLiteral,
	usesVar,
} from "#/lib/validation/ast";
import type { Puzzle } from "./types";

const modernizeAccess: Puzzle = {
	id: "modernize-access",
	title: "Modernize the lookup",
	description:
		"This legacy code reads a nested property behind a chain of `&&` guards, " +
		"concatenates strings with `+`, and uses `var`. Modernize it while keeping " +
		"the output identical: each user should log `<name> lives in <city>`, " +
		'falling back to "Unknown" when no city is set.',
	language: "js",
	tags: ["es-syntax"],
	initialCode: `function getCity(user) {
	if (user && user.address && user.address.city) {
		return user.address.city;
	}
	return "Unknown";
}

var users = [
	{ name: "Ada", address: { city: "London" } },
	{ name: "Linus" },
];

for (var i = 0; i < users.length; i++) {
	console.log(users[i].name + " lives in " + getCity(users[i]));
}
`,
	solution: `function getCity(user) {
	return user?.address?.city ?? "Unknown";
}

const users = [
	{ name: "Ada", address: { city: "London" } },
	{ name: "Linus" },
];

for (const user of users) {
	console.log(\`\${user.name} lives in \${getCity(user)}\`);
}
`,
	hints: [
		"Optional chaining (`?.`) short-circuits to `undefined` the moment a link in the chain is null/undefined — it can replace the whole `user && user.address && ...` guard.",
		'Nullish coalescing (`??`) returns its right side only when the left is null or undefined — perfect for the `"Unknown"` fallback.',
		// biome-ignore lint/suspicious/noTemplateCurlyInString: literal ${...} is part of the hint text
		"Template literals (backticks) interpolate with `${...}`, so you can drop the `+` concatenation. And there's no `var` left to need — use `const`/`for...of`.",
	],
	checks: [
		{
			id: "optional-chaining",
			label: "Uses optional chaining (?.)",
			validate: (ctx) => usesOptionalChaining(ctx.ast),
		},
		{
			id: "nullish-coalescing",
			label: "Uses nullish coalescing (??)",
			validate: (ctx) => usesNullishCoalescing(ctx.ast),
		},
		{
			id: "template-literal",
			label: "Uses a template literal instead of + concatenation",
			validate: (ctx) => usesTemplateLiteral(ctx.ast),
		},
		{
			id: "no-var",
			label: "No `var` declarations remain",
			validate: (ctx) => ctx.ast !== null && !usesVar(ctx.ast),
		},
		{
			id: "runs-clean",
			label: "Runs without errors",
			validate: (ctx) => ctx.run.error === null && !ctx.run.timedOut,
		},
		{
			id: "correct-output",
			label: "Logs the two expected lines",
			validate: (ctx) => {
				const lines = ctx.run.logs.flatMap((entry) => entry.args);
				return (
					lines.includes("Ada lives in London") &&
					lines.includes("Linus lives in Unknown")
				);
			},
		},
	],
};

export const puzzles: Puzzle[] = [modernizeAccess];

export function getPuzzle(id: string): Puzzle | undefined {
	return puzzles.find((p) => p.id === id);
}

export const defaultPuzzle = modernizeAccess;
