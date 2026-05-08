import { realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { findUpSync } from "find-up";

export const findWorkspaceRoot = (cwd = process.cwd()) => {
	const workspaceManifestPath = findUpSync("pnpm-workspace.yaml", { cwd: realpathSync(cwd) });

	return workspaceManifestPath ? dirname(workspaceManifestPath) : null;
};

export const getLocalDataDirectory = (cwd = process.cwd()) => {
	const workspaceRoot = findWorkspaceRoot(cwd);

	return join(workspaceRoot ?? realpathSync(cwd), "data");
};
