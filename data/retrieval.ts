// Types for the concept-retrieval index. Data loaded at runtime from
// public/data/retrieval.json (built by pipeline/analyzers/build_retrieval_index.py).
// The archive returns REAL chapters with citations — it never generates prose.
export type RetrievalChapter = {
  id: string;
  score: number;
  hits: number;
  volume: number;
  title: string;
};
export type RetrievalConcept = {
  id: string;
  aliases: string[];
  chapterCount: number;
  chapters: RetrievalChapter[];
};
export type RetrievalIndex = { concepts: RetrievalConcept[] };
