import { createTRPCRouter, publicProcedure } from '~/server/api/trpc.server';
import { env } from '~/server/env.mjs';


/**
 * This is the primary router for the backend. Mainly, this deals with letting
 * the frontend know what capabilities are available, by virtue of being
 * pre-configured in the servr. In the future this will evolve to a better
 * server-side configuration system.
 */
export const backendRouter = createTRPCRouter({

  /* List server-side capabilities (pre-configured by the deployer) */
  listCapabilities: publicProcedure
    .query(async () => {
      return {
        hasDB: !!env.POSTGRES_PRISMA_URL && !!env.POSTGRES_URL_NON_POOLING,
        hasGoogleCustomSearch: !!env.GOOGLE_CSE_ID && !!env.GOOGLE_CLOUD_API_KEY,
        hasImagingProdia: !!env.PRODIA_API_KEY,
        hasLlmAnthropic: !!env.ANTHROPIC_API_KEY,
        hasLlmAzureOpenAI: !!env.AZURE_OPENAI_API_KEY && !!env.AZURE_OPENAI_API_ENDPOINT,
        hasLlmOllama: !!env.OLLAMA_API_HOST,
        hasLlmOpenAI: !!env.OPENAI_API_KEY || !!env.OPENAI_API_HOST,
        hasLlmOpenRouter: !!env.OPENROUTER_API_KEY,
        hasVoiceElevenLabs: !!env.ELEVENLABS_API_KEY,
      };
    }),

});