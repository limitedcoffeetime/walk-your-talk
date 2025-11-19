# TextWalk - 3D Conversation Visualization

Visualize your conversation as a path through 3D semantic space! Each message you type gets converted to a vector embedding using OpenAI's API, reduced to 3D, and displayed as a vector in Three.js.

## What It Does

- Type text messages
- Each message gets converted to a 3072-dimensional embedding vector
- The embedding is reduced to 3D coordinates
- A vector arrow is drawn from the current position in that direction
- Watch your conversation trace a path through semantic space!

## Setup

### Prerequisites
- Node.js installed
- OpenAI API key

### Installation

1. Make sure your `.env` file has your OpenAI API key:
```bash
OPENAI_API_KEY=your_api_key_here
```

2. Install dependencies (should already be done):
```bash
npm install
```

### Run the App

Start both the backend server and frontend with one command:
```bash
npm run dev
```

This will:
- Start the backend server on `http://localhost:3000`
- Start the Vite dev server (usually `http://localhost:5173`)

Open the Vite URL in your browser and start typing!

### Alternative: Run Servers Separately

Backend only:
```bash
npm run server
```

Frontend only:
```bash
npm run client
```

## How to Use

1. Open the app in your browser
2. Type a message in the text input area
3. Click "Add to Path" or press `Cmd/Ctrl + Enter`
4. Watch as a new vector appears in 3D space!
5. Keep adding messages to build a path through semantic space
6. Use your mouse to navigate:
   - **Left drag**: Rotate view
   - **Right drag**: Pan
   - **Scroll**: Zoom

## How It Works

### Dimensionality Reduction

The OpenAI embeddings are 1536-dimensional vectors. To visualize them in 3D, we:
1. Divide the embedding into 3 equal chunks
2. Sum each chunk to get x, y, z values
3. Normalize to create a unit vector
4. Scale for visibility

This preserves more semantic information than just taking the first 3 dimensions.

### Files

- `index.html` - Frontend UI
- `main.js` - Three.js visualization
- `server.js` - Backend API server for OpenAI embeddings
- `embedding.js` - Standalone CLI tool to test embeddings

## Testing Embeddings (CLI)

To test the embedding API without the UI:
```bash
npm run embedding
```

## Examples to Try

Try typing messages on different topics and watch how the conversation moves through space:
- "I love programming"
- "Python is my favorite language"
- "The weather is beautiful today"
- "I'm going for a walk"

Notice how similar topics create vectors in similar directions!!
