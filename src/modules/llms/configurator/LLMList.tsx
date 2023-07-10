import * as React from 'react';
import { shallow } from 'zustand/shallow';

import { List, ListItem, Typography } from '@mui/joy';

import { LLMListItem } from './LLMListItem';
import { findVendorById } from '../vendor.registry';
import { useModelsStore } from '../store-llms';


export function LLMList() {

  // external state
  const { chatLLMId, fastLLMId, funcLLMId, llms } = useModelsStore(state => ({
    chatLLMId: state.chatLLMId,
    fastLLMId: state.fastLLMId,
    funcLLMId: state.funcLLMId,
    llms: state.llms,
  }), shallow);

  // find out if there's more than 1 sourceLabel in the llms array
  const singleOrigin = llms.length < 2 || !llms.find(llm => llm._source !== llms[0]._source);
  let lastGroupLabel = '';

  // generate the list items, prepending headers when necessary
  const items: React.JSX.Element[] = [];
  for (const llm of llms) {

    // prepend label if changing source
    const groupLabel = llm._source.label;
    if (!singleOrigin && groupLabel !== lastGroupLabel) {
      lastGroupLabel = groupLabel;
      items.push(
        <ListItem key={'lab-' + llm._source.id} sx={{ justifyContent: 'center' }}>
          <Typography level='body2'>
            {groupLabel}
          </Typography>
        </ListItem>,
      );
    }

    // for safety, ensure the vendor exists
    const vendor = findVendorById(llm._source.vId);
    !!vendor && items.push(
      <LLMListItem key={'llm-' + llm.id} llm={llm} vendor={vendor} chipChat={llm.id === chatLLMId} chipFast={llm.id === fastLLMId} chipFunc={llm.id === funcLLMId} />,
    );
  }

  return (
    <List variant='soft' size='sm' sx={{
      borderRadius: 'sm',
      pl: { xs: 0, md: 1 },
    }}>
      {items}
    </List>
  );
}