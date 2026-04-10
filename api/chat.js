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
    // 🌍 GET NPCs FROM SUPABASE
    // ============================
    const npcRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/npcs`, {
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });

    let npcs = await npcRes.json();

    // pick random NPC
    const npc = npcs[Math.floor(Math.random() * npcs.length)];

    // update mood
    let mood = npc.mood + (Math.random() * 10 - 5);
    mood = Math.max(0, Math.min(100, mood));

    // update NPC memory
    let memory = [];
    try {
      memory = JSON.parse(npc.memory || "[]");
    } catch {}

    memory.push(lastUserMessage);

    // save back to Supabase
    await fetch(`${process.env.SUPABASE_URL}/rest/v1/npcs?id=eq.${npc.id}`, {
      method: "PATCH",
      headers: {
        apikey: process.env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        mood,
        memory: JSON.stringify(memory)
      })
    });

    const worldEvents = [
      "Anchor Points shift across districts",
      "Faction tensions increase",
      "A hidden NPC remembers something important",
      "Recovery Points stabilize emotional flux"
    ];

    const event =
      worldEvents[Math.floor(Math.random() * worldEvents.length)];

    return res.status(200).json({
      role: "assistant",
      content:
`🌍 WORLD RESPONSE

You said: "${lastUserMessage}"

🌐 World Event: ${event}

🧍 NPC ENCOUNTER:
${npc.name} (${npc.faction}) says:
"I remember what you said... it changes things."

👤 NPC STATE:
Mood: ${Math.round(mood)}/100
Memory Count: ${memory.length}

🧠 This NPC now remembers you permanently.`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
