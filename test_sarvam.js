const { SarvamAIClient } = require('sarvamai');

// Load environment variables from .env if available
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env');
  } catch {
    // Ignore if .env is missing or cannot be loaded
  }
}

async function main() {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.error('Error: SARVAM_API_KEY is not set. Please set it in .env');
    process.exit(1);
  }

  const client = new SarvamAIClient({
    apiSubscriptionKey: apiKey,
  });

  const response = await client.chat.completions({
    model: 'sarvam-105b-conversations',
    messages: [
      {
        role: 'user',
        content: 'Hello! Introduce yourself briefly in one sentence.',
      },
    ],
  });

  const reply = response.choices?.[0]?.message?.content;
  console.log(reply);
}

main().catch((err) => {
  console.error('API call error:', err.message || err);
  process.exit(1);
});
