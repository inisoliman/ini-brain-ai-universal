import { AiProvider, AiProviderSettings } from './types';

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name = 'openai-compatible';

  constructor(private readonly settings: AiProviderSettings) {}

  async chat(system: string, user: string): Promise<string> {
    validateSettings(this.settings);
    const base = this.settings.apiBaseUrl.endsWith('/') ? this.settings.apiBaseUrl : `${this.settings.apiBaseUrl}/`;
    const url = new URL('chat/completions', base).toString();
    const timeoutMs = this.settings.requestTimeoutMs && this.settings.requestTimeoutMs > 0
      ? this.settings.requestTimeoutMs
      : 120000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.settings.apiKey}`
        },
        body: JSON.stringify({
          model: this.settings.modelName,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.2
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`AI provider failed ${response.status}: ${await response.text()}`);
      }
      const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      return json.choices?.[0]?.message?.content?.trim() || '';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`AI request timed out after ${Math.round(timeoutMs / 1000)}s. Increase iniBrain.requestTimeoutMs or check your provider.`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

export function validateSettings(settings: AiProviderSettings): void {
  if (!settings.apiBaseUrl.trim()) throw new Error('API Base URL is required.');
  try {
    const parsed = new URL(settings.apiBaseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new Error('API Base URL must be a valid http or https URL.');
  }
  if (!settings.modelName.trim()) throw new Error('Model name is required.');
  if (!settings.apiKey?.trim()) throw new Error('API key is required for AI-assisted features.');
}
