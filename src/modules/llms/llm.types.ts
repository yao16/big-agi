import type React from 'react';

import type { LLMOptionsOpenAI, SourceSetupOpenAI } from './openai/openai.vendor';
import type { ModelVendorCallChatFn, ModelVendorCallChatWithFunctionsFn } from './llm.client';
import type { SourceSetupLocalAI } from './localai/localai.vendor';


export type DLLMId = string;
export type DLLMOptions = LLMOptionsOpenAI; //DLLMValuesOpenAI | DLLMVaLocalAIDLLMValues;
export type DModelSourceId = string;
export type DModelSourceSetup = SourceSetupOpenAI | SourceSetupLocalAI;
export type ModelVendorId =
  | 'localai'
  | 'oobabooga'
  | 'openai';
// | 'anthropic'
// | 'azure_openai'
// | 'google_vertex'


/// Large Language Model - a model that can generate text
export interface DLLM {
  id: DLLMId;
  label: string;
  created: number | 0;
  description: string;
  tags: string[]; // UNUSED for now
  contextTokens: number;
  hidden: boolean;

  // llm -> source
  sId: DModelSourceId;
  _source: DModelSource;

  // llm-specific
  options: Partial<DLLMOptions>;
}


/// An origin of models - has enough parameters to list models and invoke generation
export interface DModelSource {
  id: DModelSourceId;
  label: string;

  // source -> vendor
  vId: ModelVendorId;

  // source-specific
  setup: Partial<DModelSourceSetup>;
}


/// Hardcoded vendors - have factory methods to enable dynamic configuration / access
export interface ModelVendor {
  id: ModelVendorId;
  name: string;
  rank: number;
  location: 'local' | 'cloud';
  instanceLimit: number;

  // components
  Icon: React.ComponentType;
  SourceSetupComponent: React.ComponentType<{ sourceId: DModelSourceId }>;
  LLMOptionsComponent: React.ComponentType<{ llm: DLLM }>;

  // functions
  callChat: ModelVendorCallChatFn;
  callChatWithFunctions: ModelVendorCallChatWithFunctionsFn;
}