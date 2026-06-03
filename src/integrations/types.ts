import { IntegrationTarget, McpServerConfig } from '../core/types';

export interface IntegrationAdapter {
  target: IntegrationTarget;
  displayName: string;
  description: string;
  docsPath: string;
  supportsAutoInstall: boolean;
  buildConfig(root: string, serverScript: string): McpServerConfig;
  installInstructions(root: string, serverScript: string): string;
}
