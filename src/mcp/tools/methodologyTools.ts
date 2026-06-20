import { listSpecs, readSpec, createSpec } from '../../methodology/specKit';
import { listSkills, resolveSkillChain } from '../../methodology/superpowers';

export const methodologyTools = {
  ini_brain_spec_list: {
    description: 'List all specs.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => ({ specs: await listSpecs(root) }),
  },
  ini_brain_spec_read: {
    description: 'Read spec by slug.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
    handler: async (args: { slug: string }, root: string) => readSpec(root, args.slug),
  },
  ini_brain_spec_create: {
    description: 'Create a new spec.',
    inputSchema: {
      type: 'object',
      properties: {
        featureName: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['featureName', 'description'],
    },
    handler: async (args: { featureName: string; description: string }, root: string) =>
      createSpec({ root, featureName: args.featureName, description: args.description }),
  },
  ini_brain_skills_list: {
    description: 'List skills.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => ({ skills: await listSkills(root) }),
  },
  ini_brain_skills_resolve: {
    description: 'Resolve a skill and its @-references.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    handler: async (args: { id: string }, root: string) => {
      const chain = await resolveSkillChain(root, args.id);
      return { chain: chain.map(s => ({ id: s.id, title: s.title, refs: s.references })) };
    },
  },
};
