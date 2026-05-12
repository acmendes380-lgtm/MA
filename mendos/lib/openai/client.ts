import OpenAI from 'openai'

export function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
  })
}
