const API_URL = "https://rpg-ai-world-smoky.vercel.app/api/chat";

function getMemory() {
  try {
    return JSON.parse(localStorage.getItem("rpg_memory") || "[]");
  } catch {
    return [];
  }
}

function saveMemory(memory) {
  localStorage.setItem("rpg_memory", JSON.stringify(memory));
}

function addToChat(role, text) {
  const chat = document.getElementById("chat");
  chat.innerHTML += `<p><b>${role}:</b> ${text}</p>`;
}

async function send() {
  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addToChat("You", text);

  let memory = getMemory();
  memory.push({ role: "user", content: text });

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: memory })
    });

    const data = await res.json();

    if (!res.ok) {
      addToChat("ERROR", JSON.stringify(data));
      return;
    }

    const reply = data.content || data.message || "No response";

    memory.push({ role: "assistant", content: reply });
    saveMemory(memory);

    addToChat("World", reply);

  } catch (err) {
    addToChat("NETWORK ERROR", err.message);
  }
}
