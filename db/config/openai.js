import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "", // Usa process.env si es posible
});

export default client;