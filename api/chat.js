export default async function handler(req, res) {
  try {
    // 🌐 CORS HEADERS (FIX ALL PRE-FLIGHT ERRORS)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // IMPORTANT: Handle preflight request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Parse body safely
    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const messages = body?.messages;

    if (!messages) {
      return res.status(400).json({ error: "Missing messages" });
    }

   const lastMessage =
  messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

const worldStates = [
  "Recovery Points are stabilizing emotional flux",
  "Neon Market factions are competing for influence",
  "Anchor Points are shifting between realities",
  "A hidden faction is recruiting in the shadows",
  "Memory echoes are becoming unstable"
];

const randomState = worldStates[Math.floor(Math.random() * worldStates.length)];

return res.status(200).json({
  role: "assistant",
  content: `🌍 WORLD UPDATE:\n\nYou said: "${lastMessage}"\n\n${randomState}.\n\nNPCs are reacting. Factions are adjusting strategy. Something new may emerge soon...`
});

    
}
