import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const port = 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// Function to reduce embedding to 3D
function reduceTo3D(embedding) {
  // Strategy: Take weighted sum of chunks of the embedding vector
  // This preserves more information than just taking first 3 dimensions
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
  const scale = 2; // Scale factor for visibility in 3D space

  return {
    x: (x / magnitude) * scale,
    y: (y / magnitude) * scale,
    z: (z / magnitude) * scale
  };
}

// Endpoint to get embedding and convert to 3D vector
app.post('/api/embed', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('Getting embedding for:', text);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    const embedding = embeddingResponse.data[0].embedding;
    const vector3D = reduceTo3D(embedding);

    console.log('3D vector:', vector3D);

    res.json({
      text,
      vector: vector3D,
      embeddingDimensions: embedding.length
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log('Ready to receive embedding requests!');
});
