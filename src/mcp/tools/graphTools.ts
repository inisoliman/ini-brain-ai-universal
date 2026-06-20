import { buildCodeGraph, loadGraph, saveGraph, computeImpact } from '../../graph/knowledgeGraph';

export const graphTools = {
  ini_brain_graph_build: {
    description: 'Build project knowledge graph.',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args: unknown, root: string) => {
      const graph = await buildCodeGraph(root);
      await saveGraph(root, graph);
      return { nodes: graph.nodes.length, edges: graph.edges.length };
    },
  },
  ini_brain_graph_impact: {
    description: 'Blast radius for a file.',
    inputSchema: {
      type: 'object',
      properties: { file: { type: 'string' } },
      required: ['file'],
    },
    handler: async (args: { file: string }, root: string) => {
      const graph = await loadGraph(root);
      if (!graph) return { error: 'No graph built yet.' };
      return computeImpact(graph, args.file);
    },
  },
};
