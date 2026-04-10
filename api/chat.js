module.exports = async function handler(req, res) {  
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

let npcReply = "";

try {
  const response = await fetch(
  "https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2",
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.HF_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7
      }
    })
  }
);

const data = await response.json();

  // 🔥 ALWAYS read as text first (prevents JSON crash)
  const rawText = await hfResponse.text();

  // ==============================
  // HANDLE HTTP ERRORS
  // ==============================
  if (!hfResponse.ok) {
    console.log("HF HTTP ERROR:", rawText);

    if (rawText.includes("Not Found")) {
      npcReply = "NPC connection failed (model not available).";
    } else if (rawText.includes("loading")) {
      npcReply = `${npc.name} is thinking... try again.`;
    } else {
      npcReply = `${npc.name} cannot respond right now.`;
    }
  } 
  else {
    // ==============================
    // SAFE JSON PARSE
    // ==============================
    let hfData;

    try {
      hfData = JSON.parse(rawText);
    } catch (err) {
      console.log("HF NON-JSON RESPONSE:", rawText);
      npcReply = `${npc.name} stays silent... the signal is unclear.`;
    }

    // ==============================
    // EXTRACT RESPONSE SAFELY
    // ==============================
    if (!npcReply) {
      if (Array.isArray(hfData) && hfData[0]?.generated_text) {
        npcReply = hfData[0].generated_text;
      } 
      else if (hfData?.generated_text) {
        npcReply = hfData.generated_text;
      } 
      else if (hfData?.error) {
        npcReply = `NPC is thinking... (${hfData.error})`;
      } 
      else {
        npcReply = `${npc.name} stares at you silently...`;
      }
    }
  }

} catch (err) {
  console.log("HF FETCH CRASH:", err);
  npcReply = `${npc.name} cannot connect to the world right now.`;
}

        console.log("prompt", prompt);


    const hfData = await hfResponse.json();

    console.log("HF RAW RESPONSE:", hfData);
    

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
