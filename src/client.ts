import {
	type HTTPBatchLinkOptions,
	type HTTPLinkOptions,
	httpBatchLink,
	httpLink,
	splitLink,
	type TRPCLink,
} from "@trpc/client";

/**
 * Creates a tRPC link that handles FormData requests differently from regular requests.
 * Uses splitLink to route FormData requests through httpLink and other requests through httpBatchLink.
 *
 * @param opts - HTTP link options for configuring the connection
 * @param falseCaseOverride - Optional override link for non-FormData requests (defaults to httpBatchLink)
 * @returns A tRPC link that conditionally handles FormData vs regular requests
 */
export function formDataLink(
	opts: HTTPLinkOptions<any>,
	falseCaseOverride?: TRPCLink<any>,
) {
	const optsAdjusted = {
		...opts,
		fetch: fetchFn(opts.fetch),
	};

	if (
		opts?.transformer &&
		typeof opts.transformer === "object" &&
		"deserialize" in opts.transformer
	) {
		optsAdjusted.transformer = {
			serialize: (data) => data,
			deserialize: opts.transformer.deserialize,
		};
	}

	return splitLink({
		condition: (op) => op.input instanceof FormData,
		true: httpLink(optsAdjusted),
		false:
			falseCaseOverride ?? httpBatchLink(opts as HTTPBatchLinkOptions<any>),
	});
}

type FetchEsque = HTTPLinkOptions<any>["fetch"];
type ResponseEsque = ReturnType<NonNullable<FetchEsque>>;

/**
 * Creates a custom fetch function that properly handles FormData requests.
 * Removes Content-Type header for FormData to let the browser set the correct boundary.
 *
 * @param providedFetch - Optional custom fetch function, defaults to global fetch
 * @returns A fetch function that handles FormData correctly
 */
const fetchFn =
	(providedFetch: FetchEsque | undefined): FetchEsque =>
	async (...args) => {
		const [url, options] = args;

		let headers = { ...options?.headers } as Record<string, string>;
		const isFormData = options?.body instanceof FormData;

		if (isFormData) {
			// If the body is FormData, we don't want to set Content-Type
			// because the browser will automatically set it with the correct boundary
			const { "Content-Type": _, ...restHeaders } = headers;
			headers = restHeaders;
		}

		const response = (providedFetch ?? fetch)(url, {
			...options,
			headers,
		});

		return response as ResponseEsque;
	};
