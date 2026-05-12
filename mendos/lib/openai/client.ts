import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY ?? 'placeholder',
  baseURL: 'https://openrouter.ai/api/v1',
})
