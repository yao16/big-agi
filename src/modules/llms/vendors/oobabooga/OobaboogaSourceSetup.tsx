import * as React from 'react';

import { Alert, Box, Typography } from '@mui/joy';

import { FormTextField } from '~/common/components/forms/FormTextField';
import { InlineError } from '~/common/components/InlineError';
import { Link } from '~/common/components/Link';
import { SetupFormRefetchButton } from '~/common/components/forms/SetupFormRefetchButton';
import { apiQuery } from '~/common/util/trpc.client';
import { settingsGap } from '~/common/theme';

import type { LLMOptionsOpenAI } from '../openai/openai.vendor';
import { DLLM, DModelSource, DModelSourceId, useModelsStore, useSourceSetup } from '../../store-llms';

import { ModelVendorOoobabooga, SourceSetupOobabooga } from './oobabooga.vendor';


export function OobaboogaSourceSetup(props: { sourceId: DModelSourceId }) {

  // external state
  const { source, sourceHasLLMs, access, updateSetup } =
    useSourceSetup(props.sourceId, ModelVendorOoobabooga.getAccess);

  // derived state
  const { oaiHost } = access;

  // fetch models
  const { isFetching, refetch, isError, error } = apiQuery.llmOpenAI.listModels.useQuery({
    access,
  }, {
    enabled: false, //!hasModels && !!asValidURL(normSetup.oaiHost),
    onSuccess: (models) => {
      const llms: DLLM<SourceSetupOobabooga, LLMOptionsOpenAI>[] = [];
      if (source && models) {
        for (const model of models) {
          const llm = oobaboogaModelToDLLM(model, source);
          if (llm)
            llms.push(llm);
        }
      }
      useModelsStore.getState().addLLMs(llms);
    },
    staleTime: Infinity,
  });

  return <Box sx={{ display: 'flex', flexDirection: 'column', gap: settingsGap }}>

    <Typography level='body-sm'>
      You can use a running <Link href='https://github.com/oobabooga/text-generation-webui' target='_blank'>
      text-generation-webui</Link> instance as a source for local models.
      Follow <Link href='https://github.com/enricoros/big-agi/blob/main/docs/config-local-oobabooga.md' target='_blank'>
      the instructions</Link> to set up the server.
    </Typography>

    <FormTextField
      title='API Base'
      description='Excluding /v1'
      placeholder='http://127.0.0.1:5001'
      value={oaiHost}
      onChange={text => updateSetup({ oaiHost: text })}
    />

    {sourceHasLLMs && <Alert variant='soft' color='warning'>
      Success! Note The active model must be selected on the Oobabooga server, as it does not support switching models via API.
      Concurrent model execution is also not supported.
    </Alert>}

    <SetupFormRefetchButton refetch={refetch} disabled={!(oaiHost.length >= 7) || isFetching} error={isError} />

    {isError && <InlineError error={error} />}

  </Box>;
}

const NotChatModels: string[] = [
  'text-curie-001', 'text-davinci-002', 'all-mpnet-base-v2', 'gpt-3.5-turbo', 'text-embedding-ada-002',
];


function oobaboogaModelToDLLM(model: { id: string, created: number }, source: DModelSource<SourceSetupOobabooga>): DLLM<SourceSetupOobabooga, LLMOptionsOpenAI> | null {
  // if the model id is one of NotChatModels, we don't want to show it
  if (NotChatModels.includes(model.id))
    return null;
  let label = model.id.replaceAll(/[_-]/g, ' ').split(' ').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
  if (label.endsWith('.bin'))
    label = label.slice(0, -4);
  // TODO - figure out how to the context window size from Oobabooga
  const contextTokens = 4096;
  return {
    id: `${source.id}-${model.id}`,
    label,
    created: model.created || Math.round(Date.now() / 1000),
    description: 'Oobabooga model',
    tags: [], // ['stream', 'chat'],
    contextTokens,
    hidden: NotChatModels.includes(model.id),
    sId: source.id,
    _source: source,
    options: {
      llmRef: model.id,
      llmTemperature: 0.5,
      llmResponseTokens: Math.round(contextTokens / 8),
    },
  };
}