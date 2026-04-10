export default async function handler(req, res) {
  try {
    // ---------------- CORS ----------------
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    // ---------------- BODY ----------------
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const messages = body?.messages;
    if (!messages) return res.status(400).json({ error: "Missing messages" });

    const lastUserMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    const msg = lastUserMessage.toLowerCase();

    // ============================
    // 🧍 FETCH NPCs FROM DB
    // ============================
    const npcRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/npcs?select=*`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });

    const npcs = await npcRes.json();
    const npc = npcs[Math.floor(Math.random() * npcs.length)];

    // ============================
    // ❤️ RELATIONSHIP SYSTEM
    // ============================
    let trust = npc.trust ?? 0;
    let affection = npc.affection ?? 0;
    let fear = npc.fear ?? 0;

    if (msg.includes("help")) {
      trust += 5;
      affection += 3;
      fear -= 2;
    }

    if (msg.includes("attack") || msg.includes("kill")) {
      trust -= 10;
      fear += 15;
      affection -= 5;
    }

    if (msg.includes("secret")) {
      trust += 8;
      affection += 5;
    }

    // clamp
    trust = Math.max(-100, Math.min(100, trust));
    affection = Math.max(-100, Math.min(100, affection));
    fear = Math.max(0, Math.min(100, fear));

    // ============================
    // 🧠 MOOD SYSTEM (NEW)
    // ============================
    let mood = (trust + affection) - fear;
    mood = Math.max(-100, Math.min(100, mood));

    // ============================
    // 🎭 MOOD STATES
    // ============================
    let state = "neutral";

    if (mood > 60) state = "ecstatic";
    else if (mood > 20) state = "happy";
    else if (mood > -20) state = "neutral";
    else if (mood > -60) state = "uneasy";
    else state = "hostile";

    const dialogue = {
      ecstatic: `${npc.name}: "I feel amazing around you!"`,
      happy: `${npc.name}: "It's good seeing you."`,
      neutral: `${npc.name}: "I’m observing you."`,
      uneasy: `${npc.name}: "Something feels off..."`,
      hostile: `${npc.name}: "Stay away from me."`
    };

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
        fear,
        mood
      })
    });

    // ============================
    // 🌍 WORLD EVENT
    // ============================
    const events = [
      "Anchor Points stabilize briefly",
      "Faction influence shifts quietly",
      "A memory echo passes through the world",
      "Recovery zones pulse with energy"
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    // ============================
    // 🎮 RESPONSE
    // ============================
    return res.status(200).json({
      role: "assistant",
      content:
`🧍 NPC: ${npc.name}

🌍 WORLD EVENT: 
${event}

💬 NPC REACTION:
${dialogue[state]}

📊 RELATIONSHIP:
Trust: ${trust}
Affection: ${affection}
Fear: ${fear}
Mood: ${mood}

🏛️ Faction: ${npc.faction}
🎭 Role: ${npc.role}

🧠 Mood now determines emotional behavior in real time.`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
