import { clarifySpec, createPlan, createSpec, createTasks, listSpecs, readConstitution, readNextTask, readSpec } from '../../methodology/specKit';
import { listSkills, resolveSkillChain } from '../../methodology/superpowers';

export const methodologyTools = {
  ini_brain_spec_constitution: {
    description: 'Read or create the project constitution for Spec-Kit governance.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => ({ constitution: await readConstitution(root) }),
  },
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
  ini_brain_spec_clarify: {
    description: 'Create clarification questions for a spec.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
    handler: async (args: { slug: string }, root: string) =>
      ({ clarificationsPath: await clarifySpec({ root, specSlug: args.slug }) }),
  },
  ini_brain_spec_plan: {
    description: 'Create an architecture and implementation plan for a spec.',
    inputSchema: {
      type: 'object',
      properties: {
        slug: { type: 'string' },
        techStack: { type: 'string' },
      },
      required: ['slug', 'techStack'],
    },
    handler: async (args: { slug: string; techStack: string }, root: string) =>
      ({ planPath: await createPlan({ root, specSlug: args.slug, techStack: args.techStack }) }),
  },
  ini_brain_spec_tasks: {
    description: 'Break a spec plan into implementation tasks.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
    handler: async (args: { slug: string }, root: string) =>
      ({ tasksPath: await createTasks({ root, specSlug: args.slug }) }),
  },
  ini_brain_spec_next_task: {
    description: 'Return the next unchecked task from a spec tasks file.',
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string' } },
      required: ['slug'],
    },
    handler: async (args: { slug: string }, root: string) => readNextTask(root, args.slug),
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
