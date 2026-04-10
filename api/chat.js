export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const messages = body?.messages || [];

    const lastUserMessage =
      messages.filter(m => m.role === "user").slice(-1)[0]?.content ||
      "hello";

    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: lastUserMessage
        })
      }
    );

    const data = await response.json();

    let reply =
      data?.generated_text ||
      data?.[0]?.generated_text ||
      "The world is silent...";

    return res.status(200).json({
      role: "assistant",
      content: reply
    });

  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      message: err.message
    });
  }
}
