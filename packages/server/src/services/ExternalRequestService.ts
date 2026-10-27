import { setTimeout as delay } from "node:timers/promises";
import { assertPublicHostname, parseHttpUrl, safeFetch, UnsafeUrlError } from "./UrlSafety";

type RequestOptions = {
    timeoutMs: number;
    maxBytes: number;
    maxRedirects: number;
    htmlOnly?: boolean;
    attempts?: number;
    backoffMs?: number;
};

type FetchTextProps = RequestOptions & { url: string };
type FetchImageProps = Pick<RequestOptions, "timeoutMs" | "maxRedirects"> & {
    url: string;
    attempts?: number;
    backoffMs?: number;
};
type ReadBodyProps = Pick<RequestOptions, "maxBytes" | "htmlOnly"> & { response: Response };

export class ExternalRequestError extends Error {
    constructor(
        message: string,
        readonly retryable: boolean,
        readonly statusCode?: number
    ) {
        super(message);
        this.name = "ExternalRequestError";
    }
}

export const externalRequestRetry = {
    attempts: 3,
    backoff: { type: "exponential", delay: 1_000 },
};

export const externalRequestLimits = {
    html: { timeoutMs: 10_000, maxBytes: 256 * 1024, maxRedirects: 3, htmlOnly: true },
    image: { timeoutMs: 10_000, maxRedirects: 3 },
    rss: { timeoutMs: 15_000, maxBytes: 5 * 1024 * 1024, maxRedirects: 3 },
};

const httpUrl = (input: string, base?: string) => {
    try {
        return parseHttpUrl(input, base).href;
    } catch (error) {
        // Invalid and unsafe URLs are permanent failures, not network errors.
        if (error instanceof UnsafeUrlError) {
            throw new ExternalRequestError(error.message, false);
        }
        throw new ExternalRequestError("Expected an HTTP or HTTPS URL", false);
    }
};

const assertSafeUrl = async (url: string) => {
    try {
        await assertPublicHostname(new URL(url));
    } catch (error) {
        if (error instanceof UnsafeUrlError) {
            throw new ExternalRequestError(error.message, false);
        }
        throw new ExternalRequestError("Could not verify the request host", false);
    }
};

const isUnsafeUrlError = (error: unknown) => {
    if (error instanceof UnsafeUrlError) {
        return true;
    }

    const cause = (error as { cause?: unknown } | undefined)?.cause;
    return cause instanceof UnsafeUrlError;
};

const readText = async ({ response, maxBytes, htmlOnly }: ReadBodyProps) => {
    const reader = response.body?.getReader();
    if (!reader) {
        return "";
    }
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) {
                return text + decoder.decode();
            }
            const remaining = maxBytes - bytes;
            if (!htmlOnly && value.byteLength > remaining) {
                throw new ExternalRequestError(`Response exceeds ${maxBytes} bytes`, false);
            }
            const chunk = value.subarray(0, remaining);
            bytes += chunk.byteLength;
            text += decoder.decode(chunk, { stream: true });
            const headEnd = htmlOnly ? /<\/head\s*>/i.exec(text) : undefined;
            if (headEnd) {
                return text.slice(0, headEnd.index + headEnd[0].length);
            }
            if (htmlOnly && bytes >= maxBytes) {
                return text + decoder.decode();
            }
        }
    } finally {
        await reader.cancel().catch(() => undefined);
        reader.releaseLock();
    }
};

const readBody = async ({ response, maxBytes, htmlOnly }: ReadBodyProps) => {
    if (!response.ok) {
        throw new ExternalRequestError(
            `HTTP ${response.status} from ${response.url}`,
            response.status === 408 || response.status === 429 || response.status >= 500,
            response.status
        );
    }
    if (
        htmlOnly &&
        !/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(
            response.headers.get("content-type") ?? ""
        )
    ) {
        throw new ExternalRequestError("Expected an HTML response", false);
    }
    if (!htmlOnly && Number(response.headers.get("content-length")) > maxBytes) {
        throw new ExternalRequestError(`Response exceeds ${maxBytes} bytes`, false);
    }
    return readText({ response, maxBytes, htmlOnly });
};

const fetchOnce = async ({ url, timeoutMs, maxBytes, maxRedirects, htmlOnly }: FetchTextProps) => {
    let currentUrl = httpUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response | undefined;
    try {
        for (let redirects = 0; ; redirects++) {
            await assertSafeUrl(currentUrl);
            response = await safeFetch(currentUrl, {
                signal: controller.signal,
                redirect: "manual",
            });
            if ([301, 302, 303, 307, 308].includes(response.status)) {
                const location = response.headers.get("location");
                await response.body?.cancel();
                if (!location || redirects >= maxRedirects) {
                    throw new ExternalRequestError(
                        "Invalid redirect or redirect limit exceeded",
                        false
                    );
                }
                currentUrl = httpUrl(location, currentUrl);
                continue;
            }
            const text = await readBody({ response, maxBytes, htmlOnly });
            return { text, url: currentUrl };
        }
    } catch (error) {
        if (error instanceof ExternalRequestError) {
            throw error;
        }
        if (isUnsafeUrlError(error)) {
            throw new ExternalRequestError(
                error instanceof Error ? error.message : "Unsafe request URL",
                false
            );
        }
        const message = controller.signal.aborted
            ? `Request timed out after ${timeoutMs} ms`
            : `Network request failed: ${error}`;
        throw new ExternalRequestError(message, true);
    } finally {
        clearTimeout(timeout);
        if (response?.body && !response.body.locked) {
            await response.body.cancel().catch(() => undefined);
        }
    }
};

const fetchText = async ({
    attempts = externalRequestRetry.attempts,
    backoffMs = externalRequestRetry.backoff.delay,
    ...options
}: FetchTextProps) => {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fetchOnce(options);
        } catch (error) {
            if (
                !(error instanceof ExternalRequestError) ||
                !error.retryable ||
                attempt >= attempts
            ) {
                throw error;
            }
            await delay(backoffMs * 2 ** (attempt - 1));
        }
    }
};

const fetchImageOnce = async ({ url, timeoutMs, maxRedirects }: FetchImageProps) => {
    let currentUrl = httpUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response | undefined;
    try {
        for (let redirects = 0; ; redirects++) {
            await assertSafeUrl(currentUrl);
            response = await safeFetch(currentUrl, {
                signal: controller.signal,
                redirect: "manual",
                headers: { Range: "bytes=0-0" },
            });
            if ([301, 302, 303, 307, 308].includes(response.status)) {
                const location = response.headers.get("location");
                await response.body?.cancel();
                if (!location || redirects >= maxRedirects) {
                    throw new ExternalRequestError(
                        "Invalid redirect or redirect limit exceeded",
                        false
                    );
                }
                currentUrl = httpUrl(location, currentUrl);
                continue;
            }
            if (!response.ok) {
                throw new ExternalRequestError(
                    `HTTP ${response.status} from ${response.url}`,
                    response.status === 408 || response.status === 429 || response.status >= 500,
                    response.status
                );
            }
            const contentType = response.headers.get("content-type") ?? "";
            if (!/^image\//i.test(contentType)) {
                throw new ExternalRequestError(
                    `Expected an image response, got ${contentType || "no content type"}`,
                    false,
                    response.status
                );
            }
            return { url: currentUrl, contentType };
        }
    } catch (error) {
        if (error instanceof ExternalRequestError) {
            throw error;
        }
        if (isUnsafeUrlError(error)) {
            throw new ExternalRequestError(
                error instanceof Error ? error.message : "Unsafe request URL",
                false
            );
        }
        const message = controller.signal.aborted
            ? `Request timed out after ${timeoutMs} ms`
            : `Network request failed: ${error}`;
        throw new ExternalRequestError(message, true);
    } finally {
        clearTimeout(timeout);
        if (response?.body && !response.body.locked) {
            await response.body.cancel().catch(() => undefined);
        }
    }
};

const fetchImageMetadata = async ({
    attempts = externalRequestRetry.attempts,
    backoffMs = externalRequestRetry.backoff.delay,
    ...options
}: FetchImageProps) => {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fetchImageOnce(options);
        } catch (error) {
            if (
                !(error instanceof ExternalRequestError) ||
                !error.retryable ||
                attempt >= attempts
            ) {
                throw error;
            }
            await delay(backoffMs * 2 ** (attempt - 1));
        }
    }
};

export const ExternalRequestService = { fetchText, fetchImageMetadata };
