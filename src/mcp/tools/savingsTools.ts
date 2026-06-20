import { measureText, readSavingsHistory, summarizeSavings } from '../../savings/tokenMeter';

export const savingsTools = {
  ini_brain_savings_status: {
    description: 'Show current savings stats.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => {
      const history = await readSavingsHistory(root);
      const summary = summarizeSavings(history);
      return {
        totalTokensSaved: summary.totalTokensSaved,
        totalCostSavedUsd: summary.totalCostSavedUsd,
        byMode: summary.byMode,
      };
    },
  },
  ini_brain_measure_tokens: {
    description: 'Count tokens for a given text.',
    inputSchema: {
      type: 'object',
      properties: { text: { type: 'string' } },
      required: ['text'],
    },
    handler: async (args: { text: string }) => measureText(args.text),
  },
};
