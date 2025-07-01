import {
	type HTTPBatchLinkOptions,
	type HTTPLinkOptions,
	httpBatchLink,
	httpLink,
	splitLink,
	type TRPCLink,
} from "@trpc/client";

export function formDataLink(
	opts: HTTPLinkOptions<any>,
	falseCaseOverride?: TRPCLink<any>,
) {
	return splitLink({
		condition: (op) => op.input instanceof FormData,
		true: httpLink({ ...opts, fetch: fetchFn(opts.fetch) }),
		false:
			falseCaseOverride ?? httpBatchLink(opts as HTTPBatchLinkOptions<any>),
	});
}

type FetchEsque = HTTPLinkOptions<any>["fetch"];
type ResponseEsque = ReturnType<NonNullable<FetchEsque>>;

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
