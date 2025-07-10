# tRPC FormData

A TypeScript library that enables seamless FormData support for tRPC, allowing you to handle file uploads and form submissions with full type safety.

## Features

- 🔥 **Full Type Safety**: Complete TypeScript support with proper inference
- 📁 **File Upload Support**: Built-in validation for file uploads with size and MIME type constraints
- 🚀 **Easy Integration**: Drop-in replacement for standard tRPC links
- 🛡️ **Validation**: Zod-based schema validation for FormData inputs
- 🔧 **Flexible**: Works with existing tRPC setups

## Installation

```bash
npm install trpc-formdata
# or
yarn add trpc-formdata
# or
bun add trpc-formdata
```

### Peer Dependencies

Make sure you have the required peer dependencies installed:

```bash
npm install @trpc/client @trpc/server zod typescript
```

## Quick Start

### 1. Server Setup

Create your tRPC router with FormData input validation:

```typescript
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { formDataInput } from "trpc-formdata/zod";
import { publicProcedure, router } from "./trpc";

// Define your FormData schema
const createUserSchema = formDataInput( /* 👈 */
  z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    /* 👇 */
    documents: filesSchema()
      .mimes(['application/pdf'])
      .maxSize(10 * 1024 * 1024) // 10MB
      .toZod(),
  })
);

const appRouter = router({
  user: {
    create: publicProcedure
      .input(createUserSchema)
      .mutation(async ({ input }) => {
        // input is fully typed!
        const { documents } = input; /* 👈 */
        // ...
      }),
  },
});
```

### 2. Client Setup

Configure the tRPC client with FormData support:

```typescript
const client = createTRPCClient<AppRouter>({
  links: [
    formDataLink({ /* 👈 */
      url: "http://localhost:3000",
      transformer: superjson,
    }),
  ],
});
```

### 3. Usage

Use FormData directly in your mutations:

```typescript
async function createUser() {
  const formData = new FormData();
  formData.append("name", "John Doe");
  formData.append("email", "john@example.com");
  
  // Add files
  const avatarFile = new File(["avatar data"], "avatar.jpg", { type: "image/jpeg" });
  formData.append("avatar", avatarFile);
  
  const pdfFile = new File(["pdf data"], "document.pdf", { type: "application/pdf" });
  formData.append("documents", pdfFile);
  
  // This is fully type-safe!
  const user = await client.user.create.mutate(formData); /* 👈 */
  console.log("Created user:", user);
}
```

## API Reference

### `formDataLink(options, fallback?)`

Creates a tRPC link that automatically handles FormData requests.

- **options**: Standard tRPC HTTP link options
- **fallback**: Optional link to use for non-FormData requests (defaults to `httpBatchLink`) and passes the options from the first argument.

```typescript
import { formDataLink } from "trpc-formdata/client";

const link = formDataLink({
  url: "http://localhost:3000",
});
```

### `formDataInput(schema)`

Transforms FormData into an object and validates it against a Zod schema.

```typescript
import { formDataInput } from "trpc-formdata/zod";
import { z } from "zod";

const schema = formDataInput(
  z.object({
    name: z.string(),
    age: z.number(),
  })
);
```

### `filesSchema()`

Creates a chainable builder for validating arrays of File objects with optional constraints.

```typescript
import { filesSchema } from "trpc-formdata/zod";

// Basic file validation - accepts any files
const anyFilesSchema = filesSchema().toZod();

// With constraints using method chaining
const imageSchema = filesSchema()
  .mimes(['image/jpeg', 'image/png', 'image/gif'])
  .maxSize(5 * 1024 * 1024) // 5MB
  .minSize(1024) // 1KB
  .minFiles(1) // At least 1 file
  .maxFiles(10) // At most 10 files
  .toZod();

// With custom error messages
const documentSchema = filesSchema()
  .mimes(['application/pdf'], 'Only PDF files are allowed')
  .maxSize(10 * 1024 * 1024, 'File must be smaller than 10MB')
  .minFiles(1, 'At least one document is required')
  .toZod();

// Chaining methods for complex validation
const profileImagesSchema = filesSchema()
  .mimes(['image/jpeg', 'image/png'])
  .maxSize(2 * 1024 * 1024, 'Images must be under 2MB')
  .minFiles(1, 'Profile must have at least one image')
  .maxFiles(3, 'Maximum 3 profile images allowed')
  .toZod();
```

#### Available Methods

- **`.mimes(types, error?)`**: Set accepted MIME types
- **`.maxSize(bytes, error?)`**: Set maximum file size in bytes
- **`.minSize(bytes, error?)`**: Set minimum file size in bytes
- **`.minFiles(count, error?)`**: Set minimum number of files required
- **`.maxFiles(count, error?)`**: Set maximum number of files allowed
- **`.toZod()`**: Generate the final Zod schema

Each method accepts an optional second parameter for custom error messages.

### Utility Functions

The library also exports utility functions for manual FormData conversion:

#### `formDataToObject(formData)`

Converts a FormData instance into a plain JavaScript object. Handles multiple values for the same key by creating arrays.

```typescript
import { formDataToObject } from "trpc-formdata/util";

const formData = new FormData();
formData.append("name", "John");
formData.append("files", file1);
formData.append("files", file2);

const obj = formDataToObject(formData);
// Result: { name: "John", files: [file1, file2] }
```

#### `objectToFormData(data)`

Converts a plain JavaScript object into a FormData instance. Arrays are handled by appending multiple entries with the same key.

```typescript
import { objectToFormData } from "trpc-formdata/util";

const data = {
  name: "John",
  files: [file1, file2],
  metadata: { type: "user" }
};

const formData = objectToFormData(data);
// Creates FormData with proper entries
```

## Advanced Examples

### Multiple File Uploads

```typescript
// Server
const multiUploadSchema = formDataInput(
  z.object({
    category: z.enum(["documents", "images", "videos"]),
    files: filesSchema() /* 👈 */
      .mimes(['*/*']) // Accept all types
      .maxSize(100 * 1024 * 1024) // 100MB per file
      .minFiles(1) // At least 1 file
      .maxFiles(10) // At most 10 files
      .toZod(),
  })
);

// Client
async function uploadMultipleFiles(files: File[], category: string) {
  const formData = new FormData();
  formData.append("category", category);
  
  for (const file of files) {
    formData.append("files", file);
  }
  
  return await client.upload.multiple.mutate(formData);
}
```

### Form with Mixed Data Types

```typescript
// Server
const profileSchema = formDataInput(
  z.object({
    // Text fields
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    bio: z.string().optional(),
    
    // Numeric fields
    age: z.number().int().min(18).max(120),
    
    // Boolean fields
    isPublic: z.boolean(),
    
    // Array of files using filesSchema
    portfolioImages: filesSchema()
      .mimes(['image/*'])
      .maxSize(10 * 1024 * 1024)
      .maxFiles(5)
      .toZod(),
  })
);

// Client
const formData = new FormData();
formData.append("firstName", "John");
formData.append("lastName", "Doe");
formData.append("age", "25");
formData.append("isPublic", "true");

if (avatarFile) {
  formData.append("avatar", avatarFile);
}

portfolioFiles.forEach(file => {
  formData.append("portfolioImages", file);
});

const profile = await client.profile.update.mutate(formData);
```

## Real-World Example

Based on the example in this repository, here's a complete working implementation:

### Server (`server/index.ts`)

```typescript
import { promises as fs } from "node:fs";
import path from "node:path";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { z } from "zod";
import { formDataInput, filesSchema } from "trpc-formdata/zod";
import { publicProcedure, router } from "./trpc";
import { db } from "./db";

const createInputSchema = formDataInput(
  z.object({
    name: z.string().min(1, "Name is required"),
    files: filesSchema()
      .mimes(['text/plain'])
      .maxSize(5 * 1024 * 1024) // 5MB
      .toZod(),
  }),
);

const appRouter = router({
  user: {
    create: publicProcedure.input(createInputSchema).mutation(async (opts) => {
      const { input } = opts;

      // Create a new user in the database
      const user = await db.user.create(input);

      // Do something with the uploaded files
      const files = input.files;

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

export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
});

server.listen(3000);
```

### Client (`client/index.ts`)

```typescript
import { createTRPCClient } from "@trpc/client";
import { formDataLink } from "trpc-formdata/client";
import type { AppRouter } from "../server/index";
import { transformer } from "../shared/transformer";

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
```

## Development

To install dependencies:

```bash
bun install
```

To build:

```bash
bun run build
```

To run the example:

```bash
cd example
bun install
bun run dev
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
