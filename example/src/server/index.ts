/**
 * This a minimal tRPC server
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { formDataInput, zFile } from "../../../dist/zod.js";
import { db } from "./db.js";
import { publicProcedure, router } from "./trpc.js";

const createInputSchema = formDataInput(
	z.object({
		name: z.string().min(1, "Name is required"),
		files: zFile({
			acceptedMimeTypes: ["text/plain"],
			maxSize: 5 * 1024 * 1024, // 5MB
		}).array(),
	}),
);

const appRouter = router({
	user: {
		create: publicProcedure.input(createInputSchema).mutation(async (opts) => {
			const { input } = opts;
			//      ^?

			// Create a new user in the database
			const user = await db.user.create(input);
			//    ^?

			// Do something with the uploaded files
			const files = input.files;
			//    ^?

			// Write each file to disk
			const uploadDir = path.join(process.cwd(), "uploads");
			await fs.mkdir(uploadDir, { recursive: true });

			// Process each file
			for (const file of files) {
				const fileBuffer = await file.arrayBuffer();
				const filePath = path.join(uploadDir, `${user.id}-${file.name}`);
				await fs.writeFile(filePath, Buffer.from(fileBuffer));
				console.log(`File saved to ${filePath}`);
			}
			return user;
		}),
	},
});

// Export type router type signature, this is used by the client.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
	router: appRouter,
});

server.listen(3000);
