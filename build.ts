import dts from "bun-plugin-dts";

console.log(
	await Bun.build({
		entrypoints: ["./src/client.ts", "./src/zod.ts", "./src/util.ts"],
		external: ["@trpc/server", "@trpc/client", "zod"],
		outdir: "./dist",
		splitting: true,
		// minify: true,
		plugins: [dts()],
	}),
);
