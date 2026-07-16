// Monorepo-aware Metro config. The @viagem/* workspace packages ship raw TS
// (their package.json "main" points at src/index.ts), so Metro must watch the
// workspace root and resolve modules from both node_modules trees to bundle
// (and transpile) them — see apps/mobile/CLAUDE.md.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
