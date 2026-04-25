# HackTech2026

The Room is a four-agent belief simulator with K2 Think-powered dialogue generation.

## Project shape

- `server.js`: the backend source of truth for simulation state, K2 Think calls, and API routes
- `public/`: the original static frontend
- `my-app/`: the new React + Vite frontend structure

## Run the merged version locally

1. Put your key in `.env` at the repo root:
   `K2THINK_API_KEY="your-api-key"`
2. Start the backend:
   `npm start`
3. In another terminal, start the new frontend:
   `cd my-app && npm run dev`
4. Open the Vite URL, usually `http://127.0.0.1:5173`

The backend loads `.env` automatically. If `K2THINK_API_KEY` or `K2_API_KEY` is missing, or the API call fails, the app falls back to the built-in local heuristic dialogue.
