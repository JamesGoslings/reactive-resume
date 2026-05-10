import { describe, expect, it } from "vitest";
import { pwaHeadMetaTags, pwaManifest, pwaServiceWorkerRegistrationScript } from "./pwa";

describe("pwaManifest", () => {
	it("uses the same theme color and background color (dark zinc)", () => {
		expect(pwaManifest.theme_color).toBe(pwaManifest.background_color);
	});

	it("declares standalone display and portrait orientation", () => {
		expect(pwaManifest.display).toBe("standalone");
		expect(pwaManifest.orientation).toBe("portrait");
	});

	it("scopes to root '/'", () => {
		expect(pwaManifest.scope).toBe("/");
		expect(pwaManifest.start_url).toContain("/");
	});

	it("declares all icon sizes (64, 192, 512, maskable, favicon)", () => {
		const sizes = pwaManifest.icons?.map((i) => i.sizes) ?? [];
		expect(sizes).toContain("64x64");
		expect(sizes).toContain("192x192");
		expect(sizes).toContain("512x512");
	});

	it("declares at least one maskable icon", () => {
		const maskable = pwaManifest.icons?.find((i) => i.purpose === "maskable");
		expect(maskable).toBeDefined();
	});

	it("includes both wide and narrow screenshots for proper installation UI", () => {
		const wide = pwaManifest.screenshots?.filter((s) => s.form_factor === "wide");
		const narrow = pwaManifest.screenshots?.filter((s) => s.form_factor === "narrow");
		expect(wide?.length).toBeGreaterThan(0);
		expect(narrow?.length).toBeGreaterThan(0);
	});

	it("includes 'resume' in categories for app stores", () => {
		expect(pwaManifest.categories).toContain("resume");
	});
});

describe("pwaHeadMetaTags", () => {
	it("includes theme-color meta tag", () => {
		expect(pwaHeadMetaTags).toContainEqual(expect.objectContaining({ name: "theme-color" }));
	});

	it("declares apple-mobile-web-app capable", () => {
		const tag = pwaHeadMetaTags.find((t) => t.name === "apple-mobile-web-app-capable");
		expect(tag?.content).toBe("yes");
	});

	it("uses 'black-translucent' status bar style for iOS", () => {
		const tag = pwaHeadMetaTags.find((t) => t.name === "apple-mobile-web-app-status-bar-style");
		expect(tag?.content).toBe("black-translucent");
	});
});

describe("pwaServiceWorkerRegistrationScript", () => {
	it("registers the service worker only when supported", () => {
		expect(pwaServiceWorkerRegistrationScript).toContain('"serviceWorker" in navigator');
	});

	it("registers /sw.js with root scope", () => {
		expect(pwaServiceWorkerRegistrationScript).toContain("/sw.js");
		expect(pwaServiceWorkerRegistrationScript).toContain('scope: "/"');
	});

	it("registers on window load to avoid blocking initial paint", () => {
		expect(pwaServiceWorkerRegistrationScript).toContain('addEventListener("load"');
	});
});
