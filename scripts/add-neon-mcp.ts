#!/usr/bin/env bun
/**
 * Add Neon Database MCP Server
 *
 * This script adds the Neon MCP server to your workspace.
 * Usage: bun run scripts/add-neon-mcp.ts [workspace-name-or-id] [neon-api-key]
 */

import { loadStoredConfig, getWorkspaceByNameOrId } from '@craft-agent/shared/config';
import { createSource } from '@craft-agent/shared/sources';
import type { CreateSourceInput } from '@craft-agent/shared/sources/types';

async function main() {
  const args = process.argv.slice(2);

  // Get workspace
  const workspaceIdOrName = args[0];
  if (!workspaceIdOrName) {
    console.error('❌ Error: Please provide a workspace name or ID');
    console.error('Usage: bun run scripts/add-neon-mcp.ts [workspace-name-or-id] [neon-api-key]');
    process.exit(1);
  }

  const config = loadStoredConfig();
  const workspace = getWorkspaceByNameOrId(workspaceIdOrName);

  if (!workspace) {
    console.error(`❌ Error: Workspace not found: ${workspaceIdOrName}`);
    console.error('\nAvailable workspaces:');
    config.workspaces.forEach(w => {
      console.error(`  - ${w.name} (${w.id})`);
    });
    process.exit(1);
  }

  // Get API key
  const apiKey = args[1];
  if (!apiKey) {
    console.error('❌ Error: Please provide your Neon API key');
    console.error('Usage: bun run scripts/add-neon-mcp.ts [workspace-name-or-id] [neon-api-key]');
    console.error('\nYou can get your API key from: https://console.neon.tech/app/settings/api-keys');
    process.exit(1);
  }

  console.log(`\n📦 Adding Neon MCP server to workspace: ${workspace.name}`);
  console.log(`   Project ID: withered-star-35934174\n`);

  // Create the source configuration
  const sourceConfig: CreateSourceInput = {
    name: 'Neon Database',
    provider: 'neon',
    type: 'mcp',
    enabled: true,
    mcp: {
      transport: 'stdio',
      command: 'npx',
      args: [
        '-y',
        '@neondatabase/mcp-server-neon',
        'start',
        apiKey
      ],
      authType: 'none'
    },
    icon: '🐘', // PostgreSQL elephant emoji
  };

  try {
    const createdSource = await createSource(workspace.rootPath, sourceConfig);
    console.log('✅ Successfully added Neon MCP server!');
    console.log(`   Source ID: ${createdSource.id}`);
    console.log(`   Source slug: ${createdSource.slug}`);
    console.log(`\n📝 The source has been created with the following tools:`);
    console.log('   - Query your Neon Postgres databases');
    console.log('   - Manage database schemas');
    console.log('   - Execute SQL commands\n');
    console.log('💡 You can now enable this source in your sessions to interact with your Neon databases.');
    console.log('   The MCP server will connect to project: withered-star-35934174\n');
  } catch (error) {
    console.error('❌ Error creating source:', error);
    process.exit(1);
  }
}

main();
