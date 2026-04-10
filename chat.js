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
  const chat = document.getElementById("chat");

  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  chat.innerHTML += `<p><b>You:</b> ${text}</p>`;

  // SAFE MEMORY LOAD
  let memory = JSON.parse(localStorage.getItem("rpg_memory") || "[]");

  // ADD USER MESSAGE
  memory.push({ role: "user", content: text });

  console.log("SENDING TO SERVER:", memory); // DEBUG

  const res = await fetch("https://rpg-ai-world-smoky.vercel.app    /api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: memory
    })
  });

  const data = await res.json();

  if (!res.ok) {
    chat.innerHTML += `<p><b>ERROR:</b> ${JSON.stringify(data)}</p>`;
    return;
  }

  const reply = data.content || data.message || "No response";

  memory.push({ role: "assistant", content: reply });

  localStorage.setItem("rpg_memory", JSON.stringify(memory));

  chat.innerHTML += `<p><b>World:</b> ${reply}</p>`;
}
