export interface AiProviderSettings {
  apiBaseUrl: string;
  modelName: string;
  apiKey?: string;
  requestTimeoutMs?: number;
}

export interface AiProvider {
  readonly name: string;
  chat(system: string, user: string): Promise<string>;
}

export interface SkillSuggestion {
  title: string;
  whenToUse: string[];
  workflowSteps: string[];
  checks: string[];
}
