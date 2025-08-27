// llm/openai.responses.js
import OpenAI from 'openai';

export function makeOpenAiResponsesLlm({ apiKey, model, temperature = 0.6 }) {
  const client = new OpenAI({ apiKey });

  return {
    /**
     * generate({ messages, tools? })
     * messages: [{ role: 'system'|'user'|'assistant'|'tool', content: string }]
     * returns: { content, usage, raw }
     */
    async generate({ messages, tools }) {
      const res = await client.responses.create({
        model,
        temperature,
        input: messages, // Responses API accepts the messages array as "input"
        tools,           // pass tools if/when you add them
      });

      // Extract plain text
      const content =
        res.output_text ??
        (res.output?.[0]?.content?.[0]?.text ?? '');

      return {
        content,
        usage: res.usage,
        raw: res,
      };
    },
  };
}
