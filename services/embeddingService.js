const { MistralAIEmbeddings } = require("@langchain/mistralai");
const docs = require("../docs.json");

let embeddingsModel;
let docsWithEmbeddings = null;

function getEmbeddingsModel() {
  if (!embeddingsModel) {
    embeddingsModel = new MistralAIEmbeddings({
      apiKey: process.env.MISTRAL_API_KEY,
      model: "mistral-embed",
    });
  }
  return embeddingsModel;
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

async function buildDocsEmbeddings() {
  if (docsWithEmbeddings) return docsWithEmbeddings;

  console.log("🔄 Building document embeddings...");
  const model = getEmbeddingsModel();

  const texts = docs.map((doc) => `${doc.title}: ${doc.content}`);
  const embeddings = await model.embedDocuments(texts);

  docsWithEmbeddings = docs.map((doc, i) => ({
    ...doc,
    embedding: embeddings[i],
  }));

  console.log(`✅ Built embeddings for ${docsWithEmbeddings.length} documents`);
  return docsWithEmbeddings;
}

async function findRelevantDocs(query, topK = 3, threshold = 0.5) {
  const model = getEmbeddingsModel();
  const docsEmbeds = await buildDocsEmbeddings();

  const queryEmbedding = await model.embedQuery(query);

  const scored = docsEmbeds.map((doc) => ({
    title: doc.title,
    content: doc.content,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  const relevant = scored.filter((d) => d.score >= threshold).slice(0, topK);
  return relevant;
}

module.exports = { findRelevantDocs, buildDocsEmbeddings };
