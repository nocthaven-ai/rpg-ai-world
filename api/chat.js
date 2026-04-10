let npcs = [
  {
    name: "Elira Voss",
    faction: "Stillwater Circle",
    mood: 60,
    memory: [],
    role: "Mediator"
  },
  {
    name: "Kael Dray",
    faction: "Neon Cartographers",
    mood: 50,
    memory: [],
    role: "Scout"
  },
  {
    name: "Morrow Sane",
    faction: "Silent Exchange",
    mood: 40,
    memory: [],
    role: "Information Broker"
  }
];

export default async function handler(req, res) {
  try {
    // ================= CORS =================
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

    // ================= BODY =================
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const messages = body?.messages;
    if (!messages) return res.status(400).json({ error: "Missing messages" });

    const lastUserMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content || "";

    // ================= WORLD SIM =================
    const worldEvents = [
      "Anchor Points destabilize briefly",
      "Faction tensions rise in the Neon Market",
      "Recovery Points emit emotional resonance spikes",
      "A hidden memory fragment surfaces in the system",
      "Silent Exchange spreads a new rumor"
    ];

    const event = worldEvents[Math.floor(Math.random() * worldEvents.length)];

    // ================= NPC INTERACTION =================
    const npc = npcs[Math.floor(Math.random() * npcs.length)];

    // NPC reacts to player message
    npc.memory.push(lastUserMessage);
    npc.mood += Math.random() * 10 - 5; // mood shift

    if (npc.mood > 100) npc.mood = 100;
    if (npc.mood < 0) npc.mood = 0;

    const npcDialogueTemplates = [
      `${npc.name}: "I heard what you said about '${lastUserMessage}'. Be careful in these parts."`,
      `${npc.name}: "The ${npc.faction} is watching you closely now."`,
      `${npc.name}: "This world changes faster than people realize..."`,
      `${npc.name}: "You shouldn't be asking questions like that..."`,
      `${npc.name}: "Interesting... I might remember this."`
    ];

    const npcLine = npcDialogueTemplates[
      Math.floor(Math.random() * npcDialogueTemplates.length)
    ];

    // ================= RESPONSE =================
    return res.status(200).json({
      role: "assistant",
      content:
`🌍 WORLD RESPONSE

You said: "${lastUserMessage}"

🌐 World Event: ${event}

🧍 NPC ENCOUNTER:
${npcLine}

👤 NPC STATUS:
Name: ${npc.name}
Faction: ${npc.faction}
Mood: ${Math.round(npc.mood)}/100
Role: ${npc.role}

🧠 The world remembers your presence.`
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
