import { IntegrationTarget, McpServerConfig, OpenCodeMcpConfig } from '../core/types';

export interface IntegrationAdapter {
  target: IntegrationTarget;
  displayName: string;
  description: string;
  docsPath: string;
  supportsAutoInstall: boolean;
  buildConfig(root: string, serverScript: string): McpServerConfig | OpenCodeMcpConfig | { command: string; args: string[] };
  installInstructions(root: string, serverScript: string): string;
}
