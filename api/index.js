import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// Seeded random number generator for consistent "world" projection
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Box-Muller transform for normal distribution
function randomNormal(seed) {
  const u = 1 - seededRandom(seed);
  const v = 1 - seededRandom(seed + 1);
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Generate a fixed 3x3072 matrix for projection
// We use a fixed seed so the projection is always the same
const DIMENSIONS_IN = 3072; // text-embedding-3-large
const DIMENSIONS_OUT = 3;
const PROJECTION_MATRIX = [];

let seedCounter = 42; // Fixed seed
for (let i = 0; i < DIMENSIONS_OUT; i++) {
  const row = [];
  for (let j = 0; j < DIMENSIONS_IN; j++) {
    row.push(randomNormal(seedCounter));
    seedCounter += 2; // Increment by 2 for Box-Muller
  }
  PROJECTION_MATRIX.push(row);
}

// Function to reduce embedding to 3D using Random Projection
function reduceTo3D_Projection(embedding) {
  // Matrix multiplication: vector (3072) x matrix (3x3072) -> vector (3)
  let x = 0, y = 0, z = 0;

  for (let i = 0; i < DIMENSIONS_IN; i++) {
    const val = embedding[i] || 0; // Handle potential missing values safely
    x += val * PROJECTION_MATRIX[0][i];
    y += val * PROJECTION_MATRIX[1][i];
    z += val * PROJECTION_MATRIX[2][i];
  }

  // Normalize to unit vector and scale
  // This ensures we "move in that direction" with a consistent step size
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  const scale = 5; // Larger steps for the larger world

  // Avoid division by zero
  if (magnitude === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: (x / magnitude) * scale,
    y: (y / magnitude) * scale,
    z: (z / magnitude) * scale
  };
}

// Function to reduce embedding to 3D using Simple Averaging (Legacy)
function reduceTo3D_Simple(embedding) {
  const chunkSize = Math.floor(embedding.length / 3);

  let x = 0, y = 0, z = 0;

  // Divide embedding into 3 chunks and sum each
  for (let i = 0; i < chunkSize; i++) {
    x += embedding[i];
    y += embedding[chunkSize + i];
    z += embedding[2 * chunkSize + i];
  }

  // Average each dimension
  x /= chunkSize;
  y /= chunkSize;
  z /= chunkSize;

  // Normalize to unit vector and scale for visibility
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  const scale = 5; // Match the scale of the projection method for consistency

  // Avoid division by zero
  if (magnitude === 0) return { x: 0, y: 0, z: 0 };

  return {
    x: (x / magnitude) * scale,
    y: (y / magnitude) * scale,
    z: (z / magnitude) * scale
  };
}

// Endpoint to get embedding and convert to 3D vector
app.post('/api/embed', async (req, res) => {
  try {
    const { text, method } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('Getting embedding for:', text, '| Method:', method);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float",
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Verify dimensions match
    if (embedding.length !== DIMENSIONS_IN) {
      console.warn(`Expected ${DIMENSIONS_IN} dimensions but got ${embedding.length}`);
    }

    const vector3D = (method === 'simple')
      ? reduceTo3D_Simple(embedding)
      : reduceTo3D_Projection(embedding);

    console.log('3D vector:', vector3D);

    res.json({
      text,
      vector: vector3D,
      embeddingDimensions: embedding.length,
      method: method === 'simple' ? 'Simple Averaging' : 'Random Projection'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the Express app as a serverless function
export default app;
