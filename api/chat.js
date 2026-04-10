export default async function handler(req, res) {
  try {
    // SAFETY: ensure body exists
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

    const messages = body.messages;

    if (!messages) {
      return res.status(400).json({
        error: "Missing messages array",
        received: body
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

    if (!data.choices?.[0]) {
      return res.status(500).json({
        error: "OpenAI returned invalid response",
        details: data
      });
    }

    res.status(200).json(data.choices[0].message);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Server crash",
      message: err.message
    });
  }
}
