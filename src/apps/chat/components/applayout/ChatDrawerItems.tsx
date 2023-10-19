import * as React from 'react';
import { shallow } from 'zustand/shallow';

import { Box, ListDivider, ListItemDecorator, MenuItem, Typography } from '@mui/joy';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FileUploadIcon from '@mui/icons-material/FileUpload';

import { OpenAIIcon } from '~/common/components/icons/OpenAIIcon';
import { closeLayoutDrawerMenu } from '~/common/layout/store-applayout';
import { useChatStore } from '~/common/state/store-chats';
import { useUIPreferencesStore } from '~/common/state/store-ui';

import { ConversationItem } from './ConversationItem';


type ListGrouping = 'off' | 'persona';

export function ChatDrawerItems(props: {
  conversationId: string | null
  onDeleteAllConversations: () => void,
  onImportConversation: () => void,
}) {

  // local state
  const [grouping] = React.useState<ListGrouping>('off');

  // external state
  const { conversationIDs, topNewConversationId, maxChatMessages, setActiveConversationId, createConversation, deleteConversation } = useChatStore(state => ({
    conversationIDs: state.conversations.map(conversation => conversation.id),
    topNewConversationId: state.conversations.length ? state.conversations[0].messages.length === 0 ? state.conversations[0].id : null : null,
    maxChatMessages: state.conversations.reduce((longest, conversation) => Math.max(longest, conversation.messages.length), 0),
    setActiveConversationId: state.setActiveConversationId,
    createConversation: state.createConversation,
    deleteConversation: state.deleteConversation,
  }), shallow);
  const { experimentalLabs, showSymbols } = useUIPreferencesStore(state => ({
    experimentalLabs: state.experimentalLabs,
    showSymbols: state.zenMode !== 'cleaner',
  }), shallow);


  const totalConversations = conversationIDs.length;
  const hasChats = totalConversations > 0;
  const singleChat = totalConversations === 1;
  const softMaxReached = totalConversations >= 50;

  const handleNew = () => {
    // if the first in the stack is a new conversation, just activate it
    if (topNewConversationId)
      setActiveConversationId(topNewConversationId);
    else
      createConversation();
    closeLayoutDrawerMenu();
  };

  const handleConversationActivate = React.useCallback((conversationId: string, closeMenu: boolean) => {
    setActiveConversationId(conversationId);
    if (closeMenu)
      closeLayoutDrawerMenu();
  }, [setActiveConversationId]);

  const handleConversationDelete = React.useCallback((conversationId: string) => {
    if (!singleChat && conversationId)
      deleteConversation(conversationId);
  }, [deleteConversation, singleChat]);

  // grouping
  let sortedIds = conversationIDs;
  if (grouping === 'persona') {
    const conversations = useChatStore.getState().conversations;

    // group conversations by persona
    const groupedConversations: { [personaId: string]: string[] } = {};
    conversations.forEach(conversation => {
      const persona = conversation.systemPurposeId;
      if (persona) {
        if (!groupedConversations[persona])
          groupedConversations[persona] = [];
        groupedConversations[persona].push(conversation.id);
      }
    });

    // flatten grouped conversations
    sortedIds = Object.values(groupedConversations).flat();
  }

  return <>

    {/*<ListItem>*/}
    {/*  <Typography level='body-sm'>*/}
    {/*    Active chats*/}
    {/*  </Typography>*/}
    {/*</ListItem>*/}

    <MenuItem disabled={!!topNewConversationId && topNewConversationId === props.conversationId} onClick={handleNew}>
      <ListItemDecorator><AddIcon /></ListItemDecorator>
      New
    </MenuItem>

    <ListDivider sx={{ mb: 0 }} />

    <Box sx={{ flex: 1, overflowY: 'auto' }}>
      {/*<ListItem sticky sx={{ justifyContent: 'space-between', boxShadow: 'sm' }}>*/}
      {/*  <Typography level='body-sm'>*/}
      {/*    Conversations*/}
      {/*  </Typography>*/}
      {/*  <ToggleButtonGroup variant='soft' size='sm' value={grouping} onChange={(_event, newValue) => newValue && setGrouping(newValue)}>*/}
      {/*    <IconButton value='off'>*/}
      {/*      <AccessTimeIcon />*/}
      {/*    </IconButton>*/}
      {/*    <IconButton value='persona'>*/}
      {/*      <PersonIcon />*/}
      {/*    </IconButton>*/}
      {/*  </ToggleButtonGroup>*/}
      {/*</ListItem>*/}

      {sortedIds.map(conversationId =>
        <ConversationItem
          key={'c-id-' + conversationId}
          conversationId={conversationId}
          isActive={conversationId === props.conversationId}
          isSingle={singleChat}
          showSymbols={showSymbols}
          maxChatMessages={(experimentalLabs || softMaxReached) ? maxChatMessages : 0}
          conversationActivate={handleConversationActivate}
          conversationDelete={handleConversationDelete}
        />)}
    </Box>

    <ListDivider sx={{ mt: 0 }} />

    <MenuItem onClick={props.onImportConversation}>
      <ListItemDecorator>
        <FileUploadIcon />
      </ListItemDecorator>
      Import chats
      <OpenAIIcon sx={{ fontSize: 'xl', ml: 'auto' }} />
    </MenuItem>

    <MenuItem disabled={!hasChats} onClick={props.onDeleteAllConversations}>
      <ListItemDecorator><DeleteOutlineIcon /></ListItemDecorator>
      <Typography>
        Delete {totalConversations >= 2 ? `all ${totalConversations} chats` : 'chat'}
      </Typography>
    </MenuItem>

    {/*<ListItem>*/}
    {/*  <Typography level='body-sm'>*/}
    {/*    Scratchpad*/}
    {/*  </Typography>*/}
    {/*</ListItem>*/}
    {/*<MenuItem>*/}
    {/*  <ListItemDecorator />*/}
    {/*  <Typography sx={{ opacity: 0.5 }}>*/}
    {/*    Feature <Link href={`${Brand.URIs.OpenRepo}/issues/17`} target='_blank'>#17</Link>*/}
    {/*  </Typography>*/}
    {/*</MenuItem>*/}

  </>;
}