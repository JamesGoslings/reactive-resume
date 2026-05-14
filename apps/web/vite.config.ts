import type { Plugin, PluginOption } from "vite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { pwaManifest } from "./src/libs/pwa";

const rootPackageJsonPath = new URL("../../package.json", import.meta.url);
const rootPackageJson = JSON.parse(readFileSync(rootPackageJsonPath, "utf-8")) as { version: string | undefined };
const appVersion = JSON.stringify(rootPackageJson.version ?? "0.0.0");
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const rolldownRuntimeSupport = `var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
\tif (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
\t\tkey = keys[i];
\t\tif (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
\t\t\tget: ((k) => from[k]).bind(null, key),
\t\t\tenumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
\t\t});
\t}
\treturn to;
};
`;

const rolldownRuntimeHelpers = {
	__commonJSMin:
		"var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);\n",
	__esmMin: "var __esmMin = (fn, res) => () => (fn && (res = fn(fn = 0)), res);\n",
	__exportAll: `var __exportAll = (all, no_symbols) => {
\tlet target = {};
\tfor (var name in all) __defProp(target, name, {
\t\tget: all[name],
\t\tenumerable: true
\t});
\tif (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
\treturn target;
};
`,
	__require: "var __require = __reactiveResumeCreateRequire(import.meta.url);\n",
	__toCommonJS:
		'var __toCommonJS = (mod) => __hasOwnProp.call(mod, "module.exports") ? mod["module.exports"] : __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n',
	__toESM:
		'var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {\n\tvalue: mod,\n\tenumerable: true\n}) : target, mod));\n',
};

const rolldownRuntimeHelperNames = Object.keys(rolldownRuntimeHelpers) as (keyof typeof rolldownRuntimeHelpers)[];

const hasImportedBinding = (code: string, binding: string) => {
	for (const [, specifiers] of code.matchAll(/import\s*\{([^}]*)\}/g)) {
		for (const specifier of specifiers.split(",")) {
			const [, importedBinding] = specifier.trim().split(/\s+as\s+/);
			const localBinding = importedBinding ?? specifier.trim();
			if (localBinding === binding) return true;
		}
	}

	return false;
};

// Work around Nitro/Rolldown emitting runtime-helper uses before helper bindings in server chunks.
const ensureRolldownRuntimeHelpers = (): Plugin => ({
	name: "reactive-resume:ensure-rolldown-runtime-helpers",
	apply: "build",
	applyToEnvironment: (environment) => environment.name === "nitro",
	renderChunk(code) {
		const missingHelpers = rolldownRuntimeHelperNames.filter((helper) => {
			const firstUse = code.search(new RegExp(`\\b${helper}(?![\\w$])\\s*\\(`));
			if (firstUse === -1 || hasImportedBinding(code, helper)) return false;

			const helperDefinition = code.search(new RegExp(`\\b(?:const|let|var)\\s+${helper}\\s*=`));
			return helperDefinition === -1 || helperDefinition > firstUse;
		});

		if (missingHelpers.length === 0) return null;

		const createRequireImport = missingHelpers.includes("__require")
			? 'import { createRequire as __reactiveResumeCreateRequire } from "node:module";\n'
			: "";

		return {
			code: `${createRequireImport}${rolldownRuntimeSupport}${missingHelpers.map((helper) => rolldownRuntimeHelpers[helper]).join("")}${code}`,
			map: null,
		};
	},
});

const pwa = (): PluginOption =>
	VitePWA({
		outDir: ".output/public",
		useCredentials: true,
		injectRegister: false,
		includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon-180x180.png", "screenshots/**/*"],
		registerType: "autoUpdate",
		workbox: {
			skipWaiting: true,
			clientsClaim: true,
			cleanupOutdatedCaches: true,
			globPatterns: ["**/*"],
			globIgnores: ["**/manifest.webmanifest"],
			maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
			navigateFallback: null,
		},
		manifest: pwaManifest,
	}).map((plugin) => ({
		...(plugin as Plugin),
		applyToEnvironment: (environment) => environment.name === "client",
	}));

export default defineConfig({
	envDir: workspaceRoot,

	resolve: {
		tsconfigPaths: true,
	},

	define: {
		__APP_VERSION__: appVersion,
	},

	build: {
		chunkSizeWarningLimit: 10 * 1024, // 10 MB
		rolldownOptions: {
			external: ["bcrypt", "sharp", "@aws-sdk/client-s3", "ioredis", "linkedom"],
		},
	},

	server: {
		host: true,
		strictPort: true,
		port: Number.parseInt(process.env.PORT ?? "3000", 10),
	},

	plugins: [
		tailwindcss(),
		tanstackStart(),
		viteReact(),
		lingui(),
		babel({ presets: [linguiTransformerBabelPreset()] }),
		nitro({ plugins: ["plugins/1.migrate.ts", "plugins/2.storage.ts"] }),
		ensureRolldownRuntimeHelpers(),
		pwa(),
	],
});
