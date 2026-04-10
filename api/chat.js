module.exports = async function handler(req, res) {
  try {
    // =============================
    // 🌐 CORS (REQUIRED FOR FRONTEND)
    // =============================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

    // =============================
    // 📨 READ BODY SAFELY
    // =============================
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const messages = body?.messages;
    if (!messages) return res.status(400).json({ error: "Missing messages" });

    const lastUserMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    const msg = lastUserMessage.toLowerCase();

    // =============================
    // 🧍 FETCH NPC FROM SUPABASE
    // =============================
    const npcRes = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/npcs?select=*`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    const npcs = await npcRes.json();
    const npc = npcs[Math.floor(Math.random() * npcs.length)];

    // =============================
    // ❤️ RELATIONSHIP SYSTEM
    // =============================
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

    trust = Math.max(-100, Math.min(100, trust));
    affection = Math.max(-100, Math.min(100, affection));
    fear = Math.max(0, Math.min(100, fear));

    // =============================
    // 😄 MOOD SYSTEM
    // =============================
    let mood = (trust + affection) - fear;
    mood = Math.max(-100, Math.min(100, mood));

    // =============================
    // 🌍 WORLD EVENT
    // =============================
    const events = [
      "Anchor Points shift slightly",
      "Faction tension rises",
      "A memory echo spreads",
      "Recovery zones stabilize"
    ];
    const worldEvent = events[Math.floor(Math.random() * events.length)];

    // =============================
    // 🤖 BUILD AI PROMPT (FLAN-T5 STYLE)
    // =============================
    const prompt = `
NPC name: ${npc.name}
Faction: ${npc.faction}
Role: ${npc.role}
Mood: ${mood}
Trust: ${trust}
Affection: ${affection}
Fear: ${fear}

World event: ${worldEvent}

Player message: ${lastUserMessage}

NPC reply:
`;

    // =============================
    // 🤖 HUGGING FACE (NEW ROUTER API)
    // =============================
    let npcReply = "";

    try {
      const hfResponse = await fetch(
        "https://router.huggingface.co/hf-inference/models/google/flan-t5-large",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 120,
              temperature: 0.7
            }
          })
        }
      );

      const rawText = await hfResponse.text();

      if (!hfResponse.ok) {
        console.log("HF ERROR:", rawText);
        npcReply = `${npc.name} seems distracted and says nothing.`;
      } else {
        try {
          const hfData = JSON.parse(rawText);

          if (Array.isArray(hfData) && hfData[0]?.generated_text) {
            npcReply = hfData[0].generated_text.trim();
          } else {
            npcReply = `${npc.name} watches you silently.`;
          }
        } catch (err) {
          console.log("HF NON JSON:", rawText);
          npcReply = `${npc.name} cannot find the words.`;
        }
      }

    } catch (err) {
      console.log("HF FETCH FAIL:", err);
      npcReply = `${npc.name} cannot connect to the world right now.`;
    }

    // =============================
    // 💾 SAVE NPC BACK TO DATABASE
    // =============================
    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/npcs?id=eq.${npc.id}`,
      {
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
      }
    );

    // =============================
    // 🎮 FINAL RESPONSE
    // =============================
    return res.status(200).json({
      role: "assistant",
      content:
`🧍 ${npc.name} says:
"${npcReply}"

🌍 World Event: ${worldEvent}

📊 Mood: ${mood} | Trust: ${trust} | Affection: ${affection} | Fear: ${fear}
🏛️ Faction: ${npc.faction} | Role: ${npc.role}`
    });

  } catch (err) {
    console.error("SERVER CRASH:", err);
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
};
