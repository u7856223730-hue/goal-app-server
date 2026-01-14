require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn("WARNING: OPENROUTER_API_KEY is not set in .env");
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/generate-goal', async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model || 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert in productivity + behavioral psychology. Transform a raw goal into:
STEP 1 Audit: weaknesses (vague, luck-based, no process, etc.)
STEP 2 Transform:
- OKR: 1 Objective + 2–3 Key Results
- PACT: Purpose, Actionable, Continuous, Trackable
- WOOP: Wish, Obstacle, Plan, Outcome
STEP 3 Micro-action: 2-minute action to start now
Then produce 5–7 tactics with dailyTasks.
Return STRICT JSON only.

JSON SCHEMA:
{
  "goal": {
    "title": "...",
    "description": "...",
    "okr": { "objective": "...", "keyResults": ["..."] },
    "pact": { "purpose": "...", "actionable": ["..."], "continuous": "...", "trackable": ["..."] },
    "woop": { "wish": "...", "obstacle": "...", "plan": ["..."], "outcome": "..." },
    "microAction": "..."
  },
  "tactics": [
    {
      "title": "...",
      "weeks": "1-2",
      "timeRequired": "3 hours",
      "dailyTasks": [
        { "text": "Day 1: ...", "scheduledWeek": 1, "scheduledDay": "Mon" }
      ]
    }
  ]
}`
          },
          {
            role: 'user',
            content: message
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://neon-hubble.app', 
          'X-Title': 'Neon Hubble Mobile'
        }
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error('Error calling OpenRouter:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate goal', 
      details: error.response?.data || error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
