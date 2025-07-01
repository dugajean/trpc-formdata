/**
 * This is the client-side code that uses the inferred types from the server
 */
import { createTRPCClient } from "@trpc/client";
import { formDataLink } from "../../../dist/client.js";

/**
 * We only import the `AppRouter` type from the server - this is not available at runtime
 */
import type { AppRouter } from "../server/index.js";
import { transformer } from "../shared/transformer.js";

// Initialize the tRPC client
const trpc = createTRPCClient<AppRouter>({
	links: [
		formDataLink({
			url: "http://localhost:3000",
			transformer,
		}),
	],
});

async function main() {
	const file1 = new File(["Hello, this is file 1!"], "file1.txt", {
		type: "text/plain",
	});
	const file2 = new File(["This is the content of file 2."], "file2.txt", {
		type: "text/plain",
	});
	const file3 = new File(["File 3 contains some sample text."], "file3.txt", {
		type: "text/plain",
	});

	// Create FormData with name and files
	const formData = new FormData();
	formData.append("name", "dugajean");
	formData.append("files", file1);
	formData.append("files", file2);
	formData.append("files", file3);

	const createdUser = await trpc.user.create.mutate(formData);
	console.log("Created user:", createdUser);
}

void main();
