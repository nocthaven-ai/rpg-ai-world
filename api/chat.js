export default async function handler(req, res) {
  try {
    // ==============================
    // 🌐 CORS (FIXES YOUR ERRORS)
    // ==============================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Handle preflight request
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // ==============================
    // 📦 SAFE BODY PARSING
    // ==============================
    let body = req.body;

    if (!body) {
      return res.status(400).json({ error: "Missing request body" });
    }

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Missing messages array",
        received: body
      });
    }

    // ==============================
    // 🧠 GET LAST USER INPUT
    // ==============================
    const lastUserMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content ||
      "silence";

    // ==============================
    // 🌍 RPG WORLD SIMULATION ENGINE
    // (FREE MODE — NO API REQUIRED)
    // ==============================
    const worldEvents = [
      "Anchor Points shift subtly across the city grid",
      "A faction inside the Neon Market gains influence",
      "Recovery Points stabilize emotional resonance fields",
      "A hidden NPC remembers something important about you",
      "Rumors spread through Silent Exchange networks"
    ];

    const factions = [
      "Stillwater Circle",
      "Neon Cartographers",
      "Silent Exchange",
      "Echo Wardens",
      "Fractured Remnants"
    ];

    const event = worldEvents[Math.floor(Math.random() * worldEvents.length)];
    const faction = factions[Math.floor(Math.random() * factions.length)];

    // ==============================
    // 🌍 RESPONSE (ALWAYS WORKS)
    // ==============================
    return res.status(200).json({
      role: "assistant",
      content:
`🌍 WORLD RESPONSE

You said: "${lastUserMessage}"

🧠 World Event: ${event}
🏛️ Active Faction: ${faction}

NPCs are reacting to your presence.
Anchor Points are shifting.
Something is forming beneath the surface of the world...`
    });

  } catch (err) {
    // ==============================
    // 💥 SAFE ERROR HANDLING
    // ==============================
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
