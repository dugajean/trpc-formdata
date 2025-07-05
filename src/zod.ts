import z from "zod/v4";
import type { $ZodAny } from "zod/v4/core";
import { formDataToObject } from "./util";

/**
 * Transforms a FormData instance into an object and validates it against a provided Zod schema.
 * @template TSchema - The type of the Zod schema to validate against
 * @param schema - The Zod schema to validate the transformed FormData against
 * @returns A Zod schema that accepts FormData, transforms it to an object, and validates it
 */
export const formDataInput = <TSchema extends $ZodAny>(schema: TSchema) =>
	z.instanceof(FormData).transform(formDataToObject).pipe(schema);

export interface FileOptions {
	mimes?: string[];
	maxSize?: number;
	minSize?: number;
}

export interface FileErrorMessages {
	invalidTypeMessage?: string;
	fileTooLargeMessage?: string;
	fileTooSmallMessage?: string;
}

export interface FilesOptions {
	min?: number;
	max?: number;
}

export interface FilesErrorMessages {
	tooFewFilesMessage?: string;
	tooManyFilesMessage?: string;
}

/**
 * A chainable builder for creating Zod schemas that validate arrays of File objects.
 * Automatically filters out "null" placeholders from the input array.
 *
 * @example
 * // No constraints - accepts any files
 * const anyFilesSchema = new FilesSchema().toZod();
 *
 * @example
 * // Validate 1-5 image files under 10MB each
 * const imageFilesSchema = new FilesSchema()
 *   .mimes(['image/jpeg', 'image/png', 'image/gif'])
 *   .maxSize(10 * 1024 * 1024) // 10MB
 *   .minFiles(1)
 *   .maxFiles(5)
 *   .toZod();
 *
 * @example
 * // Validate documents with size constraints and custom messages
 * const docFilesSchema = new FilesSchema()
 *   .mimes(['application/pdf', 'application/msword'], 'Only PDF and Word documents are allowed')
 *   .minSize(1024) // 1KB minimum
 *   .maxSize(50 * 1024 * 1024, 'Document must be smaller than 50MB') // 50MB maximum
 *   .toZod();
 */
class FilesSchema {
	private options: {
		minSize?: number;
		maxSize?: number;
		minFiles?: number;
		maxFiles?: number;
		mimes?: string[];
	} = {};

	private errors: {
		fileTooSmall?: string;
		fileTooLarge?: string;
		invalidMimeType?: string;
		tooFewFiles?: string;
		tooManyFiles?: string;
	} = {};

	/**
	 * Set minimum file size in bytes
	 * @param size - Minimum file size in bytes
	 * @param error - Custom error message for files that are too small
	 */
	minSize(size: number, error?: string): this {
		this.options.minSize = size;
		if (error) this.errors.fileTooSmall = error;
		return this;
	}

	/**
	 * Set maximum file size in bytes
	 * @param size - Maximum file size in bytes
	 * @param error - Custom error message for files that are too large
	 */
	maxSize(size: number, error?: string): this {
		this.options.maxSize = size;
		if (error) this.errors.fileTooLarge = error;
		return this;
	}

	/**
	 * Set minimum number of files required
	 * @param count - Minimum number of files required
	 * @param error - Custom error message for too few files
	 */
	minFiles(count: number, error?: string): this {
		this.options.minFiles = count;
		if (error) this.errors.tooFewFiles = error;
		return this;
	}

	/**
	 * Set maximum number of files allowed
	 * @param count - Maximum number of files allowed
	 * @param error - Custom error message for too many files
	 */
	maxFiles(count: number, error?: string): this {
		this.options.maxFiles = count;
		if (error) this.errors.tooManyFiles = error;
		return this;
	}

	/**
	 * Set accepted MIME types
	 * @param types - Array of accepted MIME types
	 * @param error - Custom error message for invalid MIME types
	 */
	mimes(types: string[], error?: string): this {
		this.options.mimes = types;
		if (error) this.errors.invalidMimeType = error;
		return this;
	}

	/**
	 * Generate the Zod schema based on the configured options
	 */
	toZod(): z.ZodType<File[]> {
		return z.preprocess(
			(val) => (val as []).filter((v) => v !== "null"),
			(() => {
				let fileSchema = z.file();
				if (this.options.minSize !== undefined) {
					fileSchema = fileSchema.min(this.options.minSize, {
						error:
							this.errors.fileTooSmall ??
							`File size must be at least ${(this.options.minSize / 1024 / 1024).toFixed(2)} MB.`,
					});
				}
				if (this.options.maxSize !== undefined) {
					fileSchema = fileSchema.max(this.options.maxSize, {
						error:
							this.errors.fileTooLarge ??
							`File size must be less than ${(this.options.maxSize / 1024 / 1024).toFixed(2)} MB.`,
					});
				}
				if (this.options.mimes !== undefined) {
					fileSchema = fileSchema.mime(this.options.mimes, {
						error:
							this.errors.invalidMimeType ??
							`Only ${this.options.mimes.join(", ")} files are allowed.`,
					});
				}

				let arraySchema = z.array(fileSchema);
				if (this.options.minFiles !== undefined) {
					arraySchema = arraySchema.min(this.options.minFiles, {
						error:
							this.errors.tooFewFiles ??
							`At least ${this.options.minFiles} file(s) required.`,
					});
				}
				if (this.options.maxFiles !== undefined) {
					arraySchema = arraySchema.max(this.options.maxFiles, {
						error:
							this.errors.tooManyFiles ??
							`Maximum ${this.options.maxFiles} file(s) allowed.`,
					});
				}

				return arraySchema;
			})(),
		);
	}
}

/**
 * Creates a new FilesSchema builder instance
 * @returns A new FilesSchema instance for chaining
 */
export const filesSchema = () => new FilesSchema();
