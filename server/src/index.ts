import { createApp } from "./app.js";
import { env } from "./lib/env.js";

createApp().listen(env.PORT, () => {
  console.log(`Dolil server listening on http://localhost:${env.PORT} (AI: Google AI Studio, model ${env.GOOGLE_MODEL}, key ${env.GOOGLE_API_KEY ? "set" : "NOT set"})`);
});
