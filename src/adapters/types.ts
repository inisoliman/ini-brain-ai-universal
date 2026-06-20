export interface AgentAdapter {
  id: string;
  displayName: string;
  detectInstalled(root: string): Promise<boolean>;
  writeSkill(opts: { root: string; name: string; body: string }): Promise<string[]>;
  writeCommand(opts: { root: string; name: string; body: string }): Promise<string[]>;
  writeAgentsFile(opts: { root: string; body: string }): Promise<string[]>;
  removeSkill(root: string, name: string): Promise<void>;
  removeCommand(root: string, name: string): Promise<void>;
}

export interface DeploymentResult {
  adapter: string;
  files: string[];
  errors?: string[];
}
