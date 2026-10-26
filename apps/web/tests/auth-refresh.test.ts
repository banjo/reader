import assert from "node:assert/strict";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { test } from "node:test";
import { getTokenRefreshDelayMs, isSessionInvalidError } from "../src/lib/auth";
import { fetcher } from "../src/lib/fetcher";

type Handler = (res: ServerResponse, requestCount: number) => void;

const startServer = async (handler: Handler) => {
    const authorizations: (string | undefined)[] = [];
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        authorizations.push(req.headers.authorization);
        handler(res, authorizations.length);
    });

    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();

    if (!address || typeof address === "string") {
        throw new Error("Could not determine test server address");
    }

    return {
        baseURL: `http://127.0.0.1:${address.port}`,
        authorizations,
        close: () =>
            new Promise<void>((resolve, reject) =>
                server.close(error => (error ? reject(error) : resolve()))
            ),
    };
};

const unauthorized = (res: ServerResponse) => {
    res.writeHead(401, { "Content-Type": "text/plain" });
    res.end("Unauthorized");
};

const ok = (res: ServerResponse, data: unknown) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true, data }));
};

test("retries once with a refreshed token after a 401", async t => {
    const { baseURL, authorizations, close } = await startServer((res, requestCount) => {
        if (requestCount === 1) {
            unauthorized(res);
            return;
        }

        ok(res, { refreshed: true });
    });
    t.after(close);

    let refreshes = 0;
    const api = fetcher({
        token: "stale",
        baseURL,
        refreshToken: async () => {
            refreshes++;
            return "fresh";
        },
    });

    const result = await api.GET<{ refreshed: boolean }>("/feed");

    assert.ok(result.success);
    assert.deepEqual(result.data, { refreshed: true });
    assert.equal(refreshes, 1);
    assert.deepEqual(authorizations, ["Bearer stale", "Bearer fresh"]);
});

test("returns the original 401 when the refresh fails", async t => {
    const { baseURL, authorizations, close } = await startServer(res => unauthorized(res));
    t.after(close);

    let refreshes = 0;
    const api = fetcher({
        token: "stale",
        baseURL,
        refreshToken: async () => {
            refreshes++;
            return undefined;
        },
    });

    const result = await api.GET("/feed");

    if (result.success) {
        assert.fail("expected the request to fail");
    }

    assert.equal(result.status, 401);
    assert.equal(result.type, "Unauthorized");
    assert.equal(refreshes, 1);
    assert.equal(authorizations.length, 1);
});

test("does not refresh a second time when the retried request is rejected", async t => {
    const { baseURL, authorizations, close } = await startServer(res => unauthorized(res));
    t.after(close);

    let refreshes = 0;
    const api = fetcher({
        token: "stale",
        baseURL,
        refreshToken: async () => {
            refreshes++;
            return `fresh-${refreshes}`;
        },
    });

    const result = await api.GET("/feed");

    if (result.success) {
        assert.fail("expected the request to fail");
    }

    assert.equal(result.status, 401);
    assert.equal(refreshes, 1);
    assert.equal(authorizations.length, 2);
});

test("does not refresh on server errors", async t => {
    const { baseURL, authorizations, close } = await startServer(res => {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
    });
    t.after(close);

    let refreshes = 0;
    const api = fetcher({
        token: "stale",
        baseURL,
        refreshToken: async () => {
            refreshes++;
            return "fresh";
        },
    });

    const result = await api.GET("/feed");

    if (result.success) {
        assert.fail("expected the request to fail");
    }

    assert.equal(result.type, "InternalError");
    assert.equal(refreshes, 0);
    assert.ok(authorizations.every(authorization => authorization === "Bearer stale"));
});

test("does not refresh a successful request", async t => {
    const { baseURL, authorizations, close } = await startServer(res => ok(res, []));
    t.after(close);

    let refreshes = 0;
    const api = fetcher({
        token: "valid",
        baseURL,
        refreshToken: async () => {
            refreshes++;
            return "fresh";
        },
    });

    const result = await api.GET<unknown[]>("/feed");

    assert.ok(result.success);
    assert.equal(refreshes, 0);
    assert.deepEqual(authorizations, ["Bearer valid"]);
});

test("works without a refresh callback", async t => {
    const { baseURL, authorizations, close } = await startServer(res => unauthorized(res));
    t.after(close);

    const api = fetcher({ token: "stale", baseURL });
    const result = await api.GET("/feed");

    if (result.success) {
        assert.fail("expected the request to fail");
    }

    assert.equal(result.status, 401);
    assert.equal(authorizations.length, 1);
});

test("only rejected sessions count as an invalid session", () => {
    assert.equal(isSessionInvalidError(undefined), false);
    assert.equal(isSessionInvalidError(new Error("offline")), false);
    assert.equal(isSessionInvalidError({ code: "auth/network-request-failed" }), false);
    assert.equal(isSessionInvalidError({ code: "auth/user-token-expired" }), true);
    assert.equal(isSessionInvalidError({ code: "auth/user-disabled" }), true);
});

test("refreshes one minute before the token expires", () => {
    const exp = 1_700_000_000;
    const token = [
        Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url"),
        Buffer.from(JSON.stringify({ exp })).toString("base64url"),
        "signature",
    ].join(".");

    assert.equal(getTokenRefreshDelayMs(token, exp * 1000 - 120_000), 60_000);
    assert.equal(getTokenRefreshDelayMs(token, exp * 1000), 0);
});
