/**
 * ═══════════════════════════════════════════════════
 * MODULE: vector-db.js
 * PURPOSE: In-memory vector storage and semantic search
 * ═══════════════════════════════════════════════════
 *
 * Uses @xenova/transformers for local embedding generation.
 * No external API keys required for this part.
 */

let pipeline; // Lazy-loaded transformers pipeline
let knowledgeStore = []; // Array of { text, embedding }

/**
 * Initializes the embedding model.
 */
async function initModel() {
    if (pipeline) return;

    console.log('[vector-db] Loading embedding model (Xenova/all-MiniLM-L6-v2)...');
    const { pipeline: loadPipeline } = await import('@xenova/transformers');

    // Feature extraction pipeline for embeddings
    pipeline = await loadPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('[vector-db] Embedding model loaded successfully.');
}

/**
 * Generates an embedding vector for a given text.
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
async function generateEmbedding(text) {
    await initModel();
    const output = await pipeline(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

/**
 * Calculates cosine similarity between two vectors.
 * @param {number[]} v1 
 * @param {number[]} v2 
 * @returns {number}
 */
function cosineSimilarity(v1, v2) {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        mag1 += v1[i] * v1[i];
        mag2 += v2[i] * v2[i];
    }
    return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

/**
 * Indexes a list of text chunks.
 * @param {string[]} chunks 
 */
async function indexChunks(chunks) {
    console.log(`[vector-db] Indexing ${chunks.length} chunks...`);

    // Clear existing store
    knowledgeStore = [];

    for (const text of chunks) {
        const embedding = await generateEmbedding(text);
        knowledgeStore.push({ text, embedding });
    }

    console.log('[vector-db] Indexing complete.');
}

/**
 * Searches the knowledge store for the most relevant text chunks.
 * @param {string} query 
 * @param {number} topK - Number of results to return
 * @returns {Promise<string[]>}
 */
async function search(query, topK = 3) {
    if (knowledgeStore.length === 0) return [];

    const queryEmbedding = await generateEmbedding(query);

    // Score all items in store
    const scoredResults = knowledgeStore.map(item => ({
        text: item.text,
        score: cosineSimilarity(queryEmbedding, item.embedding)
    }));

    // Sort by descending similarity and return top results
    scoredResults.sort((a, b) => b.score - a.score);

    // Threshold to ensure relevance (0.4 is a reasonable baseline for this model)
    const threshold = 0.4;
    return scoredResults
        .filter(r => r.score >= threshold)
        .slice(0, topK)
        .map(r => r.text);
}

/**
 * Simple status check
 */
function getStatus() {
    return {
        modelLoaded: !!pipeline,
        chunkCount: knowledgeStore.length,
        preview: knowledgeStore.map(k => k.text.substring(0, 50) + '...')
    };
}

module.exports = { initModel, indexChunks, search, getStatus };
