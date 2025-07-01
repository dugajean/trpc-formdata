/** biome-ignore-all lint/style/noNonNullAssertion: proper checks in place */
import z, { type ZodTypeAny } from "zod";
import { formDataToObject } from "./util";

export const formDataInput = <TSchema extends ZodTypeAny>(schema: TSchema) =>
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

/**
 * Transforms a FormData instance into an object and validates it against a provided Zod schema.
 * @template TSchema - The type of the Zod schema to validate against
 * @param schema - The Zod schema to validate the transformed FormData against
 * @returns A Zod schema that accepts FormData, transforms it to an object, and validates it
 */

/**
 * Options for file validation
 * @interface FileOptions
 * @property {string[]} [acceptedMimeTypes] - List of accepted MIME types (e.g., 'image/jpeg', 'application/pdf')
 * @property {number} [maxSize] - Maximum file size in bytes
 * @property {number} [minSize] - Minimum file size in bytes
 */

/**
 * Custom error messages for file validation
 * @interface FileErrorMessages
 * @property {string} [invalidTypeMessage] - Custom message for invalid file type errors
 * @property {string} [fileTooLargeMessage] - Custom message for file too large errors
 * @property {string} [fileTooSmallMessage] - Custom message for file too small errors
 */

/**
 * Creates a Zod schema for validating File objects with optional constraints
 * @param {FileOptions} [opts] - Options for file validation
 * @param {FileErrorMessages} [msgs] - Custom error messages
 * @returns {z.ZodType<File>} A Zod schema that validates File objects
 *
 * @example
 * // Validate image files under 5MB
 * const imageSchema = zFile({
 *   acceptedMimeTypes: ['image/jpeg', 'image/png'],
 *   maxSize: 5 * 1024 * 1024 // 5MB in bytes
 * });
 */
export const zFile = (opts?: FileOptions, msgs?: FileErrorMessages) => {
	let schema = z.instanceof(File);

	if (opts) {
		if ("acceptedMimeTypes" in opts && Array.isArray(opts.acceptedMimeTypes)) {
			schema = schema.refine(
				(file) => opts.acceptedMimeTypes!.includes(file.type),
				{
					message:
						msgs?.invalidTypeMessage ??
						`Only ${opts.acceptedMimeTypes.join(", ")} files are allowed.`,
				},
			);
		}

		if ("maxSize" in opts && Number.isInteger(opts.maxSize)) {
			schema = schema.refine((file) => file.size <= opts.maxSize!, {
				message:
					msgs?.fileTooLargeMessage ??
					`File size must be less than ${(opts.maxSize! / 1024 / 1024).toFixed(2)} MB.`,
			});
		}

		if ("minSize" in opts && Number.isInteger(opts.minSize)) {
			schema = schema.refine((file) => file.size > opts.minSize!, {
				message:
					msgs?.fileTooSmallMessage ??
					`File size must be more than ${(opts.minSize! / 1024 / 1024).toFixed(2)} MB.`,
			});
		}
	}

	return schema;
};
