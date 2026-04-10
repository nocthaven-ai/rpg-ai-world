export default async function handler(req, res) {
  try {
    res.setHeader("Content-Type", "application/json");

    let body = req.body;

    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const messages = body?.messages;

    if (!messages) {
      return res.status(400).json({
        error: "Missing messages"
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages
      })
    });

    const data = await response.json();

    // OpenAI failure safety
    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI error",
        details: data
      });
    }

    const reply = data?.choices?.[0]?.message;

    if (!reply) {
      return res.status(500).json({
        error: "No reply",
        raw: data
      });
    }

    return res.status(200).json(reply);

  } catch (err) {
    return res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
