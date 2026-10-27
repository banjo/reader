import { type LookupAddress, lookup as lookupCallback } from "node:dns";
import { lookup } from "node:dns/promises";
import type { LookupFunction } from "node:net";
import { Agent, fetch as undiciFetch } from "undici";
import ipaddr from "ipaddr.js";

export class UnsafeUrlError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UnsafeUrlError";
    }
}

// Tests and local development fixture servers listen on loopback ports. Production must not
// enable this, since it turns off the private-network guard.
export const allowsPrivateNetworkRequests = () =>
    process.env.NODE_ENV !== "production" && process.env.ALLOW_PRIVATE_NETWORK_REQUESTS === "true";

const allowedPorts = new Set(["", "80", "443"]);

export const isPublicAddress = (address: string): boolean => {
    if (!ipaddr.isValid(address)) {
        return false;
    }

    const parsed = ipaddr.parse(address);

    if (parsed.kind() === "ipv6" && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) {
        return (parsed as ipaddr.IPv6).toIPv4Address().range() === "unicast";
    }

    return parsed.range() === "unicast";
};

export const parseHttpUrl = (input: string, base?: string): URL => {
    let url: URL;
    try {
        url = new URL(input, base);
    } catch {
        throw new UnsafeUrlError("Expected an HTTP or HTTPS URL");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new UnsafeUrlError("Expected an HTTP or HTTPS URL");
    }

    if (url.username || url.password) {
        throw new UnsafeUrlError("URLs with credentials are not allowed");
    }

    if (!allowsPrivateNetworkRequests() && !allowedPorts.has(url.port)) {
        throw new UnsafeUrlError(`Only ports 80 and 443 are allowed, got ${url.port}`);
    }

    return url;
};

const hostnameOf = (url: URL) => url.hostname.replace(/^\[|\]$/g, "");

export const assertPublicHostname = async (url: URL): Promise<void> => {
    if (allowsPrivateNetworkRequests()) {
        return;
    }

    const hostname = hostnameOf(url);

    if (ipaddr.isValid(hostname)) {
        if (!isPublicAddress(hostname)) {
            throw new UnsafeUrlError(`Blocked non-public address ${hostname}`);
        }
        return;
    }

    let addresses: LookupAddress[];
    try {
        addresses = await lookup(hostname, { all: true, verbatim: true });
    } catch {
        throw new UnsafeUrlError(`Could not resolve ${hostname}`);
    }

    if (!addresses.some(address => isPublicAddress(address.address))) {
        throw new UnsafeUrlError(`Blocked non-public address for ${hostname}`);
    }
};

// Undici resolves inside the connection, so a hostname cannot resolve to one address during a
// preflight check and another address when the socket opens.
export const safeLookup: LookupFunction = (hostname, options, callback) => {
    if (allowsPrivateNetworkRequests()) {
        lookupCallback(hostname, { family: options.family }, (error, address, family) => {
            callback(error, address, family);
        });
        return;
    }

    lookupCallback(hostname, { all: true, verbatim: true }, (error, addresses) => {
        if (error) {
            callback(error, "", 0);
            return;
        }

        const publicAddress = addresses.find(entry => isPublicAddress(entry.address));

        if (!publicAddress) {
            callback(new UnsafeUrlError(`Blocked non-public address for ${hostname}`), "", 0);
            return;
        }

        callback(null, publicAddress.address, publicAddress.family);
    });
};

const safeAgent = new Agent({
    connect: { lookup: safeLookup },
    keepAliveTimeout: 1_000,
    keepAliveMaxTimeout: 1_000,
});

type SafeFetchOptions = {
    signal?: AbortSignal;
    redirect?: "manual";
    headers?: Record<string, string>;
};

export const safeFetch = (url: string, options: SafeFetchOptions = {}) =>
    undiciFetch(url, { ...options, dispatcher: safeAgent }) as unknown as Promise<Response>;
