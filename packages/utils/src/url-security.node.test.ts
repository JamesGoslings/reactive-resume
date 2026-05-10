import { describe, expect, it } from "vitest";
import {
	isAllowedExternalUrl,
	isAllowedOAuthRedirectUri,
	isPrivateOrLoopbackHost,
	parseAllowedHostList,
	parseUrl,
} from "./url-security.node";

describe("isPrivateOrLoopbackHost", () => {
	describe("loopback hostnames", () => {
		it("matches localhost", () => {
			expect(isPrivateOrLoopbackHost("localhost")).toBe(true);
		});

		it("matches LOCALHOST (case-insensitive)", () => {
			expect(isPrivateOrLoopbackHost("LOCALHOST")).toBe(true);
		});

		it("matches subdomains of localhost", () => {
			expect(isPrivateOrLoopbackHost("api.localhost")).toBe(true);
		});

		it("matches IPv6 loopback ::1", () => {
			expect(isPrivateOrLoopbackHost("::1")).toBe(true);
		});

		it("matches bracketed IPv6 loopback [::1]", () => {
			expect(isPrivateOrLoopbackHost("[::1]")).toBe(true);
		});
	});

	describe("private IPv4 ranges", () => {
		it("matches 10.0.0.0/8", () => {
			expect(isPrivateOrLoopbackHost("10.0.0.1")).toBe(true);
			expect(isPrivateOrLoopbackHost("10.255.255.255")).toBe(true);
		});

		it("matches 127.0.0.0/8 (loopback)", () => {
			expect(isPrivateOrLoopbackHost("127.0.0.1")).toBe(true);
		});

		it("matches 169.254.0.0/16 (link-local)", () => {
			expect(isPrivateOrLoopbackHost("169.254.1.1")).toBe(true);
		});

		it("matches 172.16.0.0/12", () => {
			expect(isPrivateOrLoopbackHost("172.16.0.1")).toBe(true);
			expect(isPrivateOrLoopbackHost("172.31.255.255")).toBe(true);
		});

		it("does NOT match outside 172.16-31", () => {
			expect(isPrivateOrLoopbackHost("172.15.0.1")).toBe(false);
			expect(isPrivateOrLoopbackHost("172.32.0.1")).toBe(false);
		});

		it("matches 192.168.0.0/16", () => {
			expect(isPrivateOrLoopbackHost("192.168.0.1")).toBe(true);
			expect(isPrivateOrLoopbackHost("192.168.255.255")).toBe(true);
		});

		it("matches 0.0.0.0/8", () => {
			expect(isPrivateOrLoopbackHost("0.0.0.0")).toBe(true);
		});

		it("does NOT match public IPs", () => {
			expect(isPrivateOrLoopbackHost("8.8.8.8")).toBe(false);
			expect(isPrivateOrLoopbackHost("1.1.1.1")).toBe(false);
		});
	});

	describe("private IPv6 ranges", () => {
		it("matches unique-local fc00::/7", () => {
			expect(isPrivateOrLoopbackHost("fc00::1")).toBe(true);
			expect(isPrivateOrLoopbackHost("fd12::1")).toBe(true);
		});

		it("matches link-local fe80::/10", () => {
			expect(isPrivateOrLoopbackHost("fe80::1")).toBe(true);
		});

		it("does NOT match global IPv6", () => {
			expect(isPrivateOrLoopbackHost("2001:db8::1")).toBe(false);
		});
	});

	describe("non-IP, non-loopback hostnames", () => {
		it("returns false for public domain", () => {
			expect(isPrivateOrLoopbackHost("example.com")).toBe(false);
		});

		it("returns false for arbitrary string", () => {
			expect(isPrivateOrLoopbackHost("not-a-real-host")).toBe(false);
		});
	});
});

describe("parseUrl", () => {
	it("returns URL object for valid URL", () => {
		const url = parseUrl("https://example.com/path");
		expect(url).not.toBeNull();
		expect(url?.hostname).toBe("example.com");
	});

	it("returns null for invalid URL", () => {
		expect(parseUrl("not a url")).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(parseUrl("")).toBeNull();
	});

	it("returns null for relative URL", () => {
		expect(parseUrl("/path/only")).toBeNull();
	});
});

describe("parseAllowedHostList", () => {
	it("returns empty Set for undefined", () => {
		expect(parseAllowedHostList()).toEqual(new Set());
	});

	it("returns empty Set for empty string", () => {
		expect(parseAllowedHostList("")).toEqual(new Set());
	});

	it("parses single host", () => {
		expect(parseAllowedHostList("example.com")).toEqual(new Set(["example.com"]));
	});

	it("parses comma-separated list", () => {
		expect(parseAllowedHostList("example.com,api.example.com")).toEqual(new Set(["example.com", "api.example.com"]));
	});

	it("trims whitespace around entries", () => {
		expect(parseAllowedHostList(" a.com ,  b.com  ")).toEqual(new Set(["a.com", "b.com"]));
	});

	it("lowercases entries", () => {
		expect(parseAllowedHostList("Example.COM")).toEqual(new Set(["example.com"]));
	});

	it("filters out empty entries", () => {
		expect(parseAllowedHostList("a.com,,b.com,")).toEqual(new Set(["a.com", "b.com"]));
	});
});

describe("isAllowedExternalUrl", () => {
	const allowed = new Set(["api.example.com", "https://full.example.com"]);

	it("returns false for malformed URLs", () => {
		expect(isAllowedExternalUrl("not a url", allowed)).toBe(false);
	});

	it("returns false for non-https protocols", () => {
		expect(isAllowedExternalUrl("http://api.example.com", allowed)).toBe(false);
		expect(isAllowedExternalUrl("ftp://api.example.com", allowed)).toBe(false);
	});

	it("returns false when URL contains credentials", () => {
		expect(isAllowedExternalUrl("https://user:pass@api.example.com", allowed)).toBe(false);
		expect(isAllowedExternalUrl("https://user@api.example.com", allowed)).toBe(false);
	});

	it("returns false for private/loopback hosts", () => {
		expect(isAllowedExternalUrl("https://localhost", allowed)).toBe(false);
		expect(isAllowedExternalUrl("https://127.0.0.1", allowed)).toBe(false);
		expect(isAllowedExternalUrl("https://192.168.1.1", allowed)).toBe(false);
	});

	it("matches by hostname", () => {
		expect(isAllowedExternalUrl("https://api.example.com/path", allowed)).toBe(true);
	});

	it("matches by full origin", () => {
		expect(isAllowedExternalUrl("https://full.example.com/x", allowed)).toBe(true);
	});

	it("rejects non-listed hostnames", () => {
		expect(isAllowedExternalUrl("https://evil.com", allowed)).toBe(false);
	});

	it("matches case-insensitively in hostname", () => {
		expect(isAllowedExternalUrl("https://API.EXAMPLE.COM", allowed)).toBe(true);
	});
});

describe("isAllowedOAuthRedirectUri", () => {
	const trustedOrigins = ["https://app.example.com"];
	const allowed = new Set(["api.example.com"]);

	it("returns false for malformed URI", () => {
		expect(isAllowedOAuthRedirectUri("nope", trustedOrigins, allowed)).toBe(false);
	});

	it("returns false when credentials present", () => {
		expect(isAllowedOAuthRedirectUri("https://u:p@app.example.com", trustedOrigins, allowed)).toBe(false);
	});

	it("returns false when fragment present", () => {
		expect(isAllowedOAuthRedirectUri("https://app.example.com/cb#x", trustedOrigins, allowed)).toBe(false);
	});

	it("allows http for loopback (localhost)", () => {
		expect(isAllowedOAuthRedirectUri("http://localhost:3000/cb", trustedOrigins, allowed)).toBe(true);
	});

	it("allows http for 127.0.0.1", () => {
		expect(isAllowedOAuthRedirectUri("http://127.0.0.1/cb", trustedOrigins, allowed)).toBe(true);
	});

	it("allows http for IPv6 loopback", () => {
		expect(isAllowedOAuthRedirectUri("http://[::1]/cb", trustedOrigins, allowed)).toBe(true);
	});

	it("rejects http for non-loopback hosts", () => {
		expect(isAllowedOAuthRedirectUri("http://example.com/cb", trustedOrigins, allowed)).toBe(false);
	});

	it("rejects non-https/non-http protocols", () => {
		expect(isAllowedOAuthRedirectUri("ftp://example.com/cb", trustedOrigins, allowed)).toBe(false);
	});

	it("rejects https with private/loopback host", () => {
		expect(isAllowedOAuthRedirectUri("https://192.168.1.1/cb", trustedOrigins, allowed)).toBe(false);
	});

	it("matches trusted origins", () => {
		expect(isAllowedOAuthRedirectUri("https://app.example.com/cb", trustedOrigins, allowed)).toBe(true);
	});

	it("matches against allowed origins set", () => {
		expect(isAllowedOAuthRedirectUri("https://api.example.com/cb", trustedOrigins, allowed)).toBe(true);
	});

	it("rejects non-allowed public host", () => {
		expect(isAllowedOAuthRedirectUri("https://evil.com/cb", trustedOrigins, allowed)).toBe(false);
	});
});
