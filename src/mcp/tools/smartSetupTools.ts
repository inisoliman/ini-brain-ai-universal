import { applySmartSetup, createSmartSetupPlan, formatSmartSetupPlan, SmartSetupPackId } from '../../smartSetup/smartProjectSetup';

export const smartSetupTools = {
  ini_brain_smart_setup_plan: {
    description: 'Inspect the workspace locally and recommend the smallest useful INI Brain packs. Does not download or write files.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => {
      const plan = await createSmartSetupPlan(root);
      return { plan, markdown: formatSmartSetupPlan(plan) };
    },
  },
  ini_brain_smart_setup_apply: {
    description: 'Apply explicitly selected smart setup packs using bundled curated files. No repository clone or binary install.',
    inputSchema: {
      type: 'object',
      properties: {
        packIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Pack ids returned by ini_brain_smart_setup_plan.',
        },
      },
      required: ['packIds'],
    },
    handler: async (args: { packIds: SmartSetupPackId[] }, root: string) => applySmartSetup(root, args.packIds),
  },
};

