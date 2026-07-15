-- Remplace l'index ivfflat par HNSW.
-- ivfflat entraîné sur une table vide a une très mauvaise recall (résultats manquants) ;
-- HNSW ne nécessite pas d'entraînement et offre une meilleure recall sans réglage de probes.
DROP INDEX IF EXISTS idx_candidature_embeddings_vector;
CREATE INDEX idx_candidature_embeddings_vector
  ON candidature_embeddings
  USING hnsw (embedding vector_cosine_ops);
