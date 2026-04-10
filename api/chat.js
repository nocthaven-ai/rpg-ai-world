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

    // MOCK / FREE AI VERSION (safe fallback)
    const lastMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    return res.status(200).json({
      role: "assistant",
      content: `🌍 The world reacts to: "${lastMessage}". Factions whisper, Anchor Points shift, and something unseen moves in the background...`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
