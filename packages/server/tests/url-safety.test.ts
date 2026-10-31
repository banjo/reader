import assert from "node:assert/strict";
import { test } from "node:test";
import {
    ExternalRequestError,
    ExternalRequestService,
} from "../src/services/ExternalRequestService";
import {
    assertPublicHostname,
    isPublicAddress,
    parseHttpUrl,
    safeFetch,
    safeLookup,
    UnsafeUrlError,
} from "../src/services/UrlSafety";

test("public addresses are allowed and internal ranges are blocked", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"]) {
        assert.equal(isPublicAddress(address), true, address);
    }

    for (const address of [
        "0.0.0.0",
        "10.0.0.1",
        "100.64.0.1",
        "127.0.0.1",
        "169.254.169.254",
        "172.16.0.1",
        "192.168.1.1",
        "198.18.0.1",
        "224.0.0.1",
        "::",
        "::1",
        "fc00::1",
        "fe80::1",
        "::ffff:127.0.0.1",
        "2001:db8::1",
    ]) {
        assert.equal(isPublicAddress(address), false, address);
    }
});

test("only plain HTTP(S) URLs on standard ports are accepted", () => {
    assert.equal(parseHttpUrl("https://example.com/feed").href, "https://example.com/feed");
    assert.equal(parseHttpUrl("http://example.com:80/feed").href, "http://example.com/feed");

    assert.throws(() => parseHttpUrl("file:///etc/passwd"), UnsafeUrlError);
    assert.throws(() => parseHttpUrl("ftp://example.com/feed"), UnsafeUrlError);
    assert.throws(() => parseHttpUrl("https://example.com:8080/feed"), UnsafeUrlError);
    assert.throws(() => parseHttpUrl("https://user:pass@example.com/feed"), UnsafeUrlError);
});

test("hostnames resolving to internal addresses are rejected", async () => {
    await assert.rejects(() => assertPublicHostname(new URL("http://127.0.0.1")), UnsafeUrlError);
    await assert.rejects(() => assertPublicHostname(new URL("http://localhost")), UnsafeUrlError);
    await assert.rejects(() => assertPublicHostname(new URL("http://[::1]")), UnsafeUrlError);
    await assert.doesNotReject(() => assertPublicHostname(new URL("https://example.com")));
});

test("DNS lookup returns an address array when Node requests all addresses", async () => {
    const addresses = await new Promise<unknown>((resolve, reject) => {
        safeLookup("example.com", { all: true }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
    });
    assert.ok(Array.isArray(addresses));
    assert.ok(addresses.length > 0);
    for (const entry of addresses) {
        assert.equal(isPublicAddress(entry.address), true);
        assert.ok(entry.family === 4 || entry.family === 6);
    }
});

test("DNS lookup respects the requested address family for single results", async () => {
    await new Promise<void>((resolve, reject) => {
        safeLookup("example.com", { family: 4 }, (error, address, family) => {
            if (error) return reject(error);
            assert.equal(typeof address, "string");
            assert.equal(isPublicAddress(address as string), true);
            assert.equal(family, 4);
            resolve();
        });
    });
});

test("DNS lookup rejects private addresses in both callback modes", async () => {
    for (const all of [false, true]) {
        await assert.rejects(
            () =>
                new Promise((resolve, reject) => {
                    safeLookup("localhost", { all }, (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    });
                }),
            UnsafeUrlError
        );
    }
});

test("safe fetch connects to a public hostname using Node auto-family selection", async () => {
    const response = await safeFetch("https://example.com", {
        signal: AbortSignal.timeout(15_000),
    });
    assert.equal(response.status, 200);
    await response.body?.cancel();
});

test("requests to internal addresses fail as permanent request errors", async () => {
    await assert.rejects(
        () =>
            ExternalRequestService.fetchText({
                url: "http://127.0.0.1/feed",
                timeoutMs: 1_000,
                maxBytes: 1_024,
                maxRedirects: 0,
                attempts: 1,
            }),
        (error: unknown) => {
            assert.ok(error instanceof ExternalRequestError);
            assert.equal(error.retryable, false);
            assert.match(error.message, /non-public address/);
            return true;
        }
    );
});
