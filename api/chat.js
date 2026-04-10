export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

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

    if (msg.includes("help")) trust += 5;
    if (msg.includes("attack")) fear += 15;

    trust = Math.max(-100, Math.min(100, trust));
    affection = Math.max(-100, Math.min(100, affection));
    fear = Math.max(0, Math.min(100, fear));

    let mood = (trust + affection) - fear;
    mood = Math.max(-100, Math.min(100, mood));

    // ============================
    // 🌍 WORLD EVENT
    // ============================
    const events = [
      "Anchor Points shift slightly",
      "Faction tension rises",
      "A memory echo spreads",
      "Recovery zones stabilize"
    ];

    const event = events[Math.floor(Math.random() * events.length)];

    // ============================
    // 🤖 HUGGING FACE NPC AI
    // ============================
    const prompt = `
You are an NPC in a living RPG world.

NPC:
Name: ${npc.name}
Faction: ${npc.faction}
Role: ${npc.role}
Mood: ${mood}
Trust: ${trust}
Affection: ${affection}
Fear: ${fear}

World Event: ${event}

Player said: "${lastUserMessage}"

Respond as this NPC in a short immersive dialogue (1–3 sentences).
Do not break character.
`;

    const hfResponse = await fetch(
      "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt
        })
      }
    );

    const hfData = await hfResponse.json();

    console.log("HF RAW RESPONSE:", hfData);
    
    let npcReply =
      hfData?.[0]?.generated_text ||
      hfData?.generated_text ||
      `${npc.name} stares at you silently...`;

    // ============================
    // 💾 SAVE NPC STATE
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
    // 🎮 RESPONSE
    // ============================
    return res.status(200).json({
      role: "assistant",
      content:
`🧍 ${npc.name} says:

"${npcReply}"

🌍 World Event: ${event}

📊 Mood: ${mood}
Trust: ${trust}
Affection: ${affection}
Fear: ${fear}

🧠 This response is AI-generated and emotionally adaptive.`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
