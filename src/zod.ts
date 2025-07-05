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
	acceptedMimeTypes?: string[];
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
 * Creates a Zod schema for validating arrays of File objects with optional constraints.
 * Automatically filters out "null" placeholders from the input array.
 *
 * @param {Object} [options] - Configuration options for file validation
 * @param {number} [options.minSize] - Minimum file size in bytes
 * @param {number} [options.maxSize] - Maximum file size in bytes
 * @param {string[]} [options.acceptedMimeTypes] - Array of accepted MIME types (e.g., ['image/jpeg', 'image/png'])
 * @param {number} [options.minFiles] - Minimum number of files required
 * @param {number} [options.maxFiles] - Maximum number of files allowed
 * @param {Object} [messages] - Custom error messages for validation failures
 * @param {string} [messages.fileTooSmallMessage] - Error message when file is too small
 * @param {string} [messages.fileTooLargeMessage] - Error message when file is too large
 * @param {string} [messages.invalidMimeTypeMessage] - Error message when file has invalid MIME type
 * @param {string} [messages.tooFewFilesMessage] - Error message when too few files are provided
 * @param {string} [messages.tooManyFilesMessage] - Error message when too many files are provided
 * @returns {z.ZodType<File[]>} A Zod schema that validates File arrays
 *
 * @example
 * // No constraints - accepts any files
 * const anyFilesSchema = filesSchema();
 *
 * @example
 * // Validate 1-5 image files under 10MB each
 * const imageFilesSchema = filesSchema({
 *   acceptedMimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
 *   maxSize: 10 * 1024 * 1024, // 10MB
 *   minFiles: 1,
 *   maxFiles: 5
 * });
 *
 * @example
 * // Validate documents with size constraints and custom messages
 * const docFilesSchema = filesSchema({
 *   acceptedMimeTypes: ['application/pdf', 'application/msword'],
 *   minSize: 1024, // 1KB minimum
 *   maxSize: 50 * 1024 * 1024 // 50MB maximum
 * }, {
 *   fileTooLargeMessage: 'Document must be smaller than 50MB',
 *   invalidMimeTypeMessage: 'Only PDF and Word documents are allowed'
 * });
 */
export const filesSchema = (
	options?: {
		minSize?: number;
		maxSize?: number;
		minFiles?: number;
		maxFiles?: number;
		acceptedMimeTypes?: string[];
	},
	errors?: {
		fileTooSmall?: string;
		fileTooLarge?: string;
		invalidMimeType?: string;
		tooFewFiles?: string;
		tooManyFiles?: string;
	},
) =>
	z.preprocess(
		(val) => (val as []).filter((v) => v !== "null"),
		(() => {
			const fileSchema = z.file();
			if (options?.minSize !== undefined) {
				fileSchema.min(options.minSize, {
					error:
						errors?.fileTooSmall ??
						`File size must be at least ${(options.minSize / 1024 / 1024).toFixed(2)} MB.`,
				});
			}
			if (options?.maxSize !== undefined) {
				fileSchema.max(options.maxSize, {
					error:
						errors?.fileTooLarge ??
						`File size must be less than ${(options.maxSize / 1024 / 1024).toFixed(2)} MB.`,
				});
			}
			if (options?.acceptedMimeTypes !== undefined) {
				fileSchema.mime(options.acceptedMimeTypes, {
					error:
						errors?.invalidMimeType ??
						`Only ${options.acceptedMimeTypes.join(", ")} files are allowed.`,
				});
			}

			const arraySchema = z.array(fileSchema);
			if (options?.minFiles !== undefined) {
				arraySchema.min(options.minFiles, {
					error:
						errors?.tooFewFiles ??
						`At least ${options.minFiles} file(s) required.`,
				});
			}
			if (options?.maxFiles !== undefined) {
				arraySchema.max(options.maxFiles, {
					error:
						errors?.tooManyFiles ??
						`Maximum ${options.maxFiles} file(s) allowed.`,
				});
			}

			return arraySchema;
		})(),
	);
