import 'dotenv/config';
import OpenAI from 'openai';
import * as readline from 'readline';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get embedding
async function getEmbedding(text) {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
      encoding_format: "float",
    });

    console.log('\n--- Embedding Result ---');
    console.log('Model:', embedding.model);
    console.log('Embedding dimension:', embedding.data[0].embedding.length);
    console.log('\nEmbedding vector (first 10 values):');
    console.log(embedding.data[0].embedding.slice(0, 10));
    console.log('\nFull embedding:');
    console.log(embedding.data[0].embedding);
    console.log('\n--- Complete Response ---');
    console.log(embedding);
  } catch (error) {
    console.error('Error getting embedding:', error.message);
  }
}

// Prompt user for input
rl.question('Enter text to get embedding: ', async (userInput) => {
  if (!userInput.trim()) {
    console.log('No input provided. Exiting.');
    rl.close();
    return;
  }

  await getEmbedding(userInput);
  rl.close();
});
