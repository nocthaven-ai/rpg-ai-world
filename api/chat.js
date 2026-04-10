export default async function handler(req, res) {
  try {
    const { messages } = req.body;

    if (!messages) {
      return res.status(400).json({ error: "No messages provided" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages
      })
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      console.log("OpenAI response error:", data);
      return res.status(500).json({
        error: "Invalid OpenAI response",
        details: data
      });
    }

    res.status(200).json(data.choices[0].message);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Server crashed",
      message: err.message
    });
  }
}
