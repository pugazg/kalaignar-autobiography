// Types for the relationship graph. Data is loaded at runtime from
// public/data/graph.json (produced by pipeline/builders/build_graph.py),
// so rebuilding the archive updates the graph with no code change.
export type GraphNode = {
  id: string;
  en: string;
  ta: string;
  role: string;
  mentions: number;
  chapters: number;
  firstChapter: string;
  r: number;
  x: number;
  y: number;
};
export type GraphEdge = {
  source: string;
  target: string;
  weight: number;
  strength: number;
};
export type GraphData = { nodes: GraphNode[]; edges: GraphEdge[] };
