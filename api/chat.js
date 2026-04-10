export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();

    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const messages = body?.messages;
    if (!messages) {
      return res.status(400).json({ error: "Missing messages" });
    }

    const lastUserMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    // ============================
    // 🌍 FETCH NPC FROM SUPABASE
    // ============================
    const npcRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/npcs`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });

    const npcs = await npcRes.json();
    const npc = npcs[Math.floor(Math.random() * npcs.length)];

    // ============================
    // 🧠 RELATIONSHIP UPDATE LOGIC
    // ============================
    let trust = npc.trust ?? 0;
    let affection = npc.affection ?? 0;
    let fear = npc.fear ?? 0;

    const msg = lastUserMessage.toLowerCase();

    // SIMPLE BEHAVIOR ANALYSIS (NO AI REQUIRED)
    if (msg.includes("help") || msg.includes("please")) {
      trust += 5;
      affection += 3;
      fear -= 2;
    }

    if (msg.includes("attack") || msg.includes("kill") || msg.includes("threat")) {
      trust -= 10;
      fear += 15;
      affection -= 5;
    }

    if (msg.includes("secret") || msg.includes("tell me")) {
      trust += 8;
      affection += 5;
    }

    if (msg.includes("why") || msg.includes("what")) {
      fear += 1;
    }

    // clamp values
    trust = Math.max(-100, Math.min(100, trust));
    affection = Math.max(-100, Math.min(100, affection));
    fear = Math.max(0, Math.min(100, fear));

    // ============================
    // 💬 NPC RESPONSE STATE
    // ============================
    let npcEmotion = "neutral";

    if (trust > 50) npcEmotion = "trusting";
    if (affection > 50) npcEmotion = "friendly";
    if (fear > 50) npcEmotion = "afraid";
    if (trust < -50) npcEmotion = "hostile";

    const npcDialogue = {
      neutral: `${npc.name}: "I’m watching you carefully."`,
      trusting: `${npc.name}: "I think I can trust you... for now."`,
      friendly: `${npc.name}: "It’s good to see you again."`,
      afraid: `${npc.name}: "Please… don’t hurt me."`,
      hostile: `${npc.name}: "Stay away from me."`
    };

    // ============================
    // 🌍 WORLD EVENT
    // ============================
    const events = [
      "Anchor Points realign subtly",
      "Faction influence shifts in the background",
      "A memory echo spreads through the system"
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    // ============================
    // 💾 SAVE BACK TO DATABASE
    // ============================
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/npcs?id=eq.${npc.id}`, {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        trust,
        affection,
        fear
      })
    });

    // ============================
    // 🎮 RESPONSE
    // ============================
    return res.status(200).json({
      role: "assistant",
      content:
`🌍 WORLD RESPONSE

You said: "${lastUserMessage}"

🌐 World Event: ${event}

🧍 NPC RESPONSE:
${npcDialogue[npcEmotion]}

📊 RELATIONSHIP STATUS:
Trust: ${trust}
Affection: ${affection}
Fear: ${fear}

🧠 The NPC now remembers how you make them feel.`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
