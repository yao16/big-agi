import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc.server';
import { env } from '~/server/env.mjs';
import { fetchJsonOrTRPCError, fetchTextOrTRPCError } from '~/server/api/trpc.serverutils';

import { LLM_IF_OAI_Chat } from '../../../store-llms';

import { capitalizeFirstLetter } from '~/common/util/textUtils';

import { fixupHost, openAIChatGenerateOutputSchema, OpenAIHistorySchema, openAIHistorySchema, OpenAIModelSchema, openAIModelSchema } from '../openai/openai.router';
import { listModelsOutputSchema, ModelDescriptionSchema } from '../server.schemas';

import { OLLAMA_BASE_MODELS, OLLAMA_LAST_UPDATE } from './ollama.models';
import { wireOllamaGenerationSchema } from './ollama.wiretypes';


// Default hosts
const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434';


// Mappers

export function ollamaAccess(access: OllamaAccessSchema, apiPath: string): { headers: HeadersInit, url: string } {

  const ollamaHost = fixupHost(access.ollamaHost || env.OLLAMA_API_HOST || DEFAULT_OLLAMA_HOST, apiPath);

  return {
    headers: {
      'Content-Type': 'application/json',
    },
    url: ollamaHost + apiPath,
  };

}

export function ollamaChatCompletionPayload(model: OpenAIModelSchema, history: OpenAIHistorySchema, stream: boolean) {

  // if the first message is the system prompt, extract it
  let systemPrompt: string | undefined = undefined;
  if (history.length && history[0].role === 'system') {
    const [firstMessage, ...rest] = history;
    systemPrompt = firstMessage.content;
    history = rest;
  }

  // encode the prompt for ollama, assuming the same template for everyone for now
  const prompt = history.map(({ role, content }) => {
    return role === 'assistant' ? `\n\nAssistant: ${content}` : `\n\nHuman: ${content}`;
  }).join('') + '\n\nAssistant:\n';

  // const prompt = history.map(({ role, content }) => {
  //   return role === 'assistant' ? `### Response:\n${content}\n\n` : `### User:\n${content}\n\n`;
  // }).join('') + '### Response:\n';

  return {
    model: model.id,
    prompt,
    options: {
      ...(model.temperature && { temperature: model.temperature }),
    },
    ...(systemPrompt && { system: systemPrompt }),
    stream,
  };
}

async function ollamaGET<TOut extends object>(access: OllamaAccessSchema, apiPath: string /*, signal?: AbortSignal*/): Promise<TOut> {
  const { headers, url } = ollamaAccess(access, apiPath);
  return await fetchJsonOrTRPCError<TOut>(url, 'GET', headers, undefined, 'Ollama');
}

async function ollamaPOST<TOut extends object, TPostBody extends object>(access: OllamaAccessSchema, body: TPostBody, apiPath: string /*, signal?: AbortSignal*/): Promise<TOut> {
  const { headers, url } = ollamaAccess(access, apiPath);
  return await fetchJsonOrTRPCError<TOut, TPostBody>(url, 'POST', headers, body, 'Ollama');
}


// Input/Output Schemas

export const ollamaAccessSchema = z.object({
  dialect: z.enum(['ollama']),
  ollamaHost: z.string().trim(),
});
export type OllamaAccessSchema = z.infer<typeof ollamaAccessSchema>;

const accessOnlySchema = z.object({
  access: ollamaAccessSchema,
});

const adminPullModelSchema = z.object({
  access: ollamaAccessSchema,
  name: z.string(),
});

const chatGenerateInputSchema = z.object({
  access: ollamaAccessSchema,
  model: openAIModelSchema, history: openAIHistorySchema,
  // functions: openAIFunctionsSchema.optional(), forceFunctionName: z.string().optional(),
});

const listPullableOutputSchema = z.object({
  pullable: z.array(z.object({
    id: z.string(),
    label: z.string(),
    tag: z.string(),
    description: z.string(),
    isNew: z.boolean(),
  })),
});


export const llmOllamaRouter = createTRPCRouter({

  /* Ollama: models that can be pulled */
  adminListPullable: publicProcedure
    .input(accessOnlySchema)
    .output(listPullableOutputSchema)
    .query(async ({}) => {
      return {
        pullable: Object.entries(OLLAMA_BASE_MODELS).map(([model_id, model]) => ({
          id: model_id,
          label: capitalizeFirstLetter(model_id),
          tag: 'latest',
          description: model.description,
          isNew: !!model.added && model.added >= OLLAMA_LAST_UPDATE,
        })),
      };
    }),

  /* Ollama: pull a model */
  adminPull: publicProcedure
    .input(adminPullModelSchema)
    .mutation(async ({ input }) => {

      // fetch as a large text buffer, made of JSONs separated by newlines
      const { headers, url } = ollamaAccess(input.access, '/api/pull');
      const pullRequest = await fetchTextOrTRPCError(url, 'POST', headers, { 'name': input.name }, 'Ollama::pull');

      // accumulate status and error messages
      let lastStatus: string = 'unknown';
      let lastError: string | undefined = undefined;
      for (let string of pullRequest.trim().split('\n')) {
        const message = JSON.parse(string);
        if (message.status)
          lastStatus = input.name + ': ' + message.status;
        if (message.error)
          lastError = message.error;
      }

      return { status: lastStatus, error: lastError };
    }),

  /* Ollama: delete a model */
  adminDelete: publicProcedure
    .input(adminPullModelSchema)
    .mutation(async ({ input }) => {
      const { headers, url } = ollamaAccess(input.access, '/api/delete');
      const deleteOutput = await fetchTextOrTRPCError(url, 'DELETE', headers, { 'name': input.name }, 'Ollama::delete');
      if (deleteOutput?.length && deleteOutput !== 'null')
        throw new Error('Ollama delete issue: ' + deleteOutput);
    }),

  /* Ollama: List the Models available */
  listModels: publicProcedure
    .input(accessOnlySchema)
    .output(listModelsOutputSchema)
    .query(async ({ input }) => {

      // get the models
      const wireModels = await ollamaGET(input.access, '/api/tags');
      const wireOllamaListModelsSchema = z.object({
        models: z.array(z.object({
          name: z.string(),
          modified_at: z.string(),
          size: z.number(),
          digest: z.string(),
        })),
      });
      let models = wireOllamaListModelsSchema.parse(wireModels).models;

      // retrieve info for each of the models (/api/show, post call, in parallel)
      const detailedModels = await Promise.all(models.map(async model => {
        const wireModelInfo = await ollamaPOST(input.access, { 'name': model.name }, '/api/show');
        const wireOllamaModelInfoSchema = z.object({
          license: z.string().optional(),
          modelfile: z.string(),
          parameters: z.string().optional(),
          template: z.string().optional(),
        });
        const modelInfo = wireOllamaModelInfoSchema.parse(wireModelInfo);
        return { ...model, ...modelInfo };
      }));

      return {
        models: detailedModels.map(model => {
          // the model name is in the format "name:tag" (default tag = 'latest')
          const [modelName, modelTag] = model.name.split(':');

          // pretty label and description
          const label = capitalizeFirstLetter(modelName) + ((modelTag && modelTag !== 'latest') ? ` · ${modelTag}` : '');
          const description = OLLAMA_BASE_MODELS[modelName]?.description ?? 'Model unknown';

          // console.log('>>> ollama model', model.name, model.template, model.modelfile, '\n');

          return {
            id: model.name,
            label,
            created: Date.parse(model.modified_at) ?? undefined,
            updated: Date.parse(model.modified_at) ?? undefined,
            description: description, // description: (model.license ? `License: ${model.license}. Info: ` : '') + model.modelfile || 'Model unknown',
            contextWindow: 4096, // FIXME: request this information upstream?
            interfaces: [LLM_IF_OAI_Chat],
          } satisfies ModelDescriptionSchema;
        }),
      };
    }),

  /* Ollama: Chat generation */
  chatGenerate: publicProcedure
    .input(chatGenerateInputSchema)
    .output(openAIChatGenerateOutputSchema)
    .mutation(async ({ input: { access, history, model } }) => {

      const wireGeneration = await ollamaPOST(access, ollamaChatCompletionPayload(model, history, false), '/api/generate');
      const generation = wireOllamaGenerationSchema.parse(wireGeneration);

      return {
        role: 'assistant',
        content: generation.response,
        finish_reason: generation.done ? 'stop' : null,
      };
    }),

});
