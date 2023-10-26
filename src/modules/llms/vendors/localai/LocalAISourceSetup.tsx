import * as React from 'react';
import { z } from 'zod';

import { Box, Typography } from '@mui/joy';

import { FormInputKey } from '~/common/components/forms/FormInputKey';
import { InlineError } from '~/common/components/InlineError';
import { Link } from '~/common/components/Link';
import { SetupFormRefetchButton } from '~/common/components/forms/SetupFormRefetchButton';
import { apiQuery } from '~/common/util/trpc.client';
import { settingsGap } from '~/common/theme';

import type { LLMOptionsOpenAI } from '../openai/openai.vendor';
import { DLLM, DModelSource, DModelSourceId, useModelsStore, useSourceSetup } from '../../store-llms';

import { ModelVendorLocalAI, SourceSetupLocalAI } from './localai.vendor';


const urlSchema = z.string().url().startsWith('http');


export function LocalAISourceSetup(props: { sourceId: DModelSourceId }) {

  // external state
  const { source, access, updateSetup } =
    useSourceSetup(props.sourceId, ModelVendorLocalAI.getAccess);

  // derived state
  const { oaiHost } = access;

  // validate if url is a well formed proper url with zod
  const { success: isValidHost } = urlSchema.safeParse(oaiHost);
  const shallFetchSucceed = isValidHost;

  // fetch models - the OpenAI way
  const { isFetching, refetch, isError, error } = apiQuery.llmOpenAI.listModels.useQuery({
    access,
  }, {
    enabled: false, //!sourceLLMs.length && shallFetchSucceed,
    onSuccess: models => {
      const llms = source ? models.map(model => localAIToDLLM(model, source)) : [];
      useModelsStore.getState().addLLMs(llms);
    },
    staleTime: Infinity,
  });

  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: settingsGap }}>

    <Typography level='body-sm'>
      You can use a running <Link href='https://localai.io' target='_blank'>LocalAI</Link> instance as a source for local models.
      Please refer to the LocalAI website for how to get it setup and running with models, and then enter the URL below.
    </Typography>

    <FormInputKey
      id='localai-key' label='LocalAI URL'
      required noKey
      rightLabel={<Link level='body-sm' href='https://localai.io' target='_blank'>Learn more</Link>}
      placeholder='e.g., http://127.0.0.1:8080'
      value={oaiHost} onChange={value => updateSetup({ oaiHost: value })}
    />

    <SetupFormRefetchButton refetch={refetch} disabled={!shallFetchSucceed || isFetching} error={isError} />

    {isError && <InlineError error={error} />}

  </Box>;
}

const NotChatModels: string[] = [];

const ModelHeuristics: { [key: string]: { label: string, contextTokens: number } } = {
  'ggml-gpt4all-j': {
    label: 'GPT4All-J',
    contextTokens: 2048,
  },
};


function localAIToDLLM(model: { id: string, object: 'model' }, source: DModelSource<SourceSetupLocalAI>): DLLM<SourceSetupLocalAI, LLMOptionsOpenAI> {
  const h = ModelHeuristics[model.id] || {
    label: model.id
      .replace('ggml-', '')
      .replace('.bin', '')
      .replaceAll('-', ' '),
    contextTokens: 2048, // conservative default
  };
  return {
    id: `${source.id}-${model.id}`,
    label: h.label,
    created: 0,
    description: 'Local model',
    tags: [], // ['stream', 'chat'],
    contextTokens: h.contextTokens,
    hidden: NotChatModels.includes(model.id),
    sId: source.id,
    _source: source,
    options: {
      llmRef: model.id,
      llmTemperature: 0.5,
      llmResponseTokens: Math.round(h.contextTokens / 8),
    },
  };
}