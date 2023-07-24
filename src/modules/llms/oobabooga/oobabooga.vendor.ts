import { ModelVendor } from '../llm.types';

import { LLMOptionsOpenAI, ModelVendorOpenAI } from '~/modules/llms/openai/openai.vendor';
import { OpenAILLMOptions } from '~/modules/llms/openai/OpenAILLMOptions';

import { OobaboogaIcon } from './OobaboogaIcon';
import { OobaboogaSourceSetup } from './OobaboogaSourceSetup';

export interface SourceSetupOobabooga {
  oaiHost: string;  // use OpenAI-compatible non-default hosts (full origin path)
}

export const ModelVendorOoobabooga: ModelVendor<SourceSetupOobabooga, LLMOptionsOpenAI> = {
  id: 'oobabooga',
  name: 'Oobabooga (Alpha)',
  rank: 15,
  location: 'local',
  instanceLimit: 1,

  // components
  Icon: OobaboogaIcon,
  SourceSetupComponent: OobaboogaSourceSetup,
  LLMOptionsComponent: OpenAILLMOptions,

  // functions
  normalizeSetup: (partialSetup?: Partial<SourceSetupOobabooga>) => ({
    oaiHost: '',
    ...partialSetup,
  }),
  callChat: ModelVendorOpenAI.callChat,
  callChatWithFunctions: ModelVendorOpenAI.callChatWithFunctions,
};