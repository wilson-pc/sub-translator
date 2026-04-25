import { Hono } from "hono";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const app = new Hono();
type RequestBody = {
  content: string;
  family: string;
  model: string;
  key: string;
  targetLanguagePromptName: string;
};

const urls: Record<string, string | undefined> = {
  deepseek: "https://api.deepseek.com",
  kimi: "https://api.moonshot.ai/v1",
  openai: undefined,
};

function buildTranslationPrompt(sub: string, targetLanguagePromptName: string) {
  return `You are a translation assistant. Translate the following dialogues into **${targetLanguagePromptName}**.

The input text comes from an SRT subtitle file.
Each dialogue is separated by the token \`|||\`.

---

### RULES (Follow STRICTLY):
1. ⚠️ **NEVER** remove, merge, or split dialogues.
   - The number of "|||" separators in the output MUST be **exactly the same** as in the input.
   - Each dialogue in the input corresponds to **exactly one** dialogue in the output, in the same order.
2. Do NOT translate or remove the separators (\`|||\`).
3. If a dialogue is empty, strange, cut off, or unreadable, **copy it as-is**.
4. Preserve punctuation, symbols, and line breaks inside each dialogue.
5. Do NOT add comments, explanations, or extra text.
6. Return ONLY the translated dialogues with separators, nothing else.
7. Ignore drawing commands {{index}}.
8. Ignore drawing commands and return them exactly as they appear, including [[id:index]].
9. Do not add underscores (_) in the dialogues.

Remember, you're translating movies or TV episodes, so don't try to change or minimize insults or bad words, as they are important to the plot.

---

Now translate the text below following ALL the rules above:

${sub}`;
}

function appendChunkTranslation(current: string, nextChunk: string) {
  const normalizedChunk = nextChunk.trim();

  if (!normalizedChunk) {
    return current;
  }

  return current.length > 0
    ? `${current} ||| ${normalizedChunk}`
    : normalizedChunk;
}

async function translateByAnthropic(
  sub: string,
  model: string,
  key: string,
  targetLanguagePromptName: string,
) {
  const anthropic = new Anthropic({
    apiKey: key,
  });

  const msg: any = await anthropic.messages.create({
    model: model,
    max_tokens: 20000,
    messages: [
      {
        role: "user",
        content: buildTranslationPrompt(sub, targetLanguagePromptName),
      },
    ],
  });
  const content = msg.content[0].text;
  return content as string;
}
async function getFullResponse(
  prompt: string,
  url: string | undefined,
  key: string,
  model: string,
  targetLanguagePromptName: string,
) {
  const openai = new OpenAI({
    baseURL: url,
    apiKey: key,
  });
  const response = await openai.chat.completions.create({
    model: model,
    stream: false,
    messages: [
      {
        role: "system",
        content: buildTranslationPrompt(prompt, targetLanguagePromptName),
      },
    ],
  });

  const choice = response.choices[0];
  const text = choice?.message.content ?? "";

  return text;
}
async function getFullResponseOpenIa(
  prompt: string,
  url: string | undefined,
  key: string,
  model: string,
  targetLanguagePromptName: string,
) {
  const openai = new OpenAI({
    baseURL: url,
    apiKey: key,
  });
  const response = await openai.responses.create({
    model: model,
    input: [
      {
        role: "system",
        content: buildTranslationPrompt(prompt, targetLanguagePromptName),
      },
    ],
  });

  const text = response.output_text;

  return text;
}
function chunkByDelimiter(str: string, delimiter = "|||", size = 300) {
  // Dividimos en partes
  const parts = str.split(delimiter);
  const chunks = [];

  for (let i = 0; i < parts.length; i += size) {
    // Tomamos "size" partes y las volvemos a unir con el delimitador
    chunks.push(parts.slice(i, i + size).join(delimiter));
  }

  return chunks;
}

app.post("/api/translate", async (c) => {
  const { content, family, model, key, targetLanguagePromptName } =
    await c.req.json<RequestBody>();
  console.log(family);
  let translated: string = "";
  if (family === "anthropic") {
    const chunks = chunkByDelimiter(content, "|||", 500);
    for (const element of chunks) {
      const response = await translateByAnthropic(
        element,
        model,
        key,
        targetLanguagePromptName,
      );
      translated = appendChunkTranslation(translated, response);
    }
    return new Response(translated);
  }

  //deepseek
  //process.env.DEEPSEEK_API_KEY
  //https://api.deepseek.com

  if (family === "openai") {
    const chunks = chunkByDelimiter(content, "|||", 300);
    for (const element of chunks) {
      const resp = await getFullResponseOpenIa(
        element.trim(),
        urls[family],
        key,
        model,
        targetLanguagePromptName,
      );

      translated = appendChunkTranslation(translated, resp);
    }
  } else {
    const resp = await getFullResponse(
      content.trim(),
      urls[family],
      key,
      model,
      targetLanguagePromptName,
    );

    translated = appendChunkTranslation(translated, resp);
  }
  console.log(translated);
  return c.text(translated);
});

export default app;
