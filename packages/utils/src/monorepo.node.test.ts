import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { findWorkspaceRoot, getLocalDataDirectory } from "./monorepo.node";

let workspaceRoot: string;

beforeEach(async () => {
	workspaceRoot = await mkdtemp(join(tmpdir(), "reactive-resume-utils-"));
	await mkdir(join(workspaceRoot, "apps", "web", ".output", "server"), { recursive: true });
});

afterEach(async () => {
	await rm(workspaceRoot, { recursive: true, force: true });
});

test("finds the pnpm workspace root from a nested directory", async () => {
	await writeFile(join(workspaceRoot, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n");

	const root = findWorkspaceRoot(join(workspaceRoot, "apps", "web", ".output", "server"));

	expect(root).toBe(realpathSync(workspaceRoot));
});

test("rejects a pnpm workspace manifest with a .yml extension", async () => {
	await writeFile(join(workspaceRoot, "pnpm-workspace.yml"), "packages:\n  - apps/*\n  - packages/*\n");

	expect(() => findWorkspaceRoot(join(workspaceRoot, "apps", "web", ".output", "server"))).toThrow(
		/The workspace manifest file should be named "pnpm-workspace\.yaml"\. File found: .*pnpm-workspace\.yml/,
	);
});

test("returns the workspace data directory from a nested directory", async () => {
	await writeFile(join(workspaceRoot, "pnpm-workspace.yaml"), "packages:\n  - apps/*\n  - packages/*\n");

	const dataDirectory = getLocalDataDirectory(join(workspaceRoot, "apps", "web", ".output", "server"));

	expect(dataDirectory).toBe(join(realpathSync(workspaceRoot), "data"));
});

test("falls back to the cwd data directory outside a workspace", () => {
	const dataDirectory = getLocalDataDirectory(workspaceRoot);

	expect(dataDirectory).toBe(join(realpathSync(workspaceRoot), "data"));
});
