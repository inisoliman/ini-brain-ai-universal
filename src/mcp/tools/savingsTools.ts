import { compareTokenEstimates, measureText, readSavingsHistory, summarizeSavings } from '../../savings/tokenMeter';

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
  ini_brain_compare_tokens: {
    description: 'Compare two supplied texts with the same local estimate. This measures text-size reduction, not a universal model claim.',
    inputSchema: {
      type: 'object',
      properties: {
        baselineText: { type: 'string' },
        optimizedText: { type: 'string' },
      },
      required: ['baselineText', 'optimizedText'],
    },
    handler: async (args: { baselineText: string; optimizedText: string }) =>
      compareTokenEstimates(args.baselineText, args.optimizedText),
  },
};
