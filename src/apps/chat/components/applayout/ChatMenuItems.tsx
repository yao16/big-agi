import * as React from 'react';

import { Box, ListDivider, ListItemDecorator, MenuItem, Switch } from '@mui/joy';
import CheckBoxOutlineBlankOutlinedIcon from '@mui/icons-material/CheckBoxOutlineBlankOutlined';
import CheckBoxOutlinedIcon from '@mui/icons-material/CheckBoxOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import CompressIcon from '@mui/icons-material/Compress';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ForkRightIcon from '@mui/icons-material/ForkRight';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import { KeyStroke } from '~/common/components/KeyStroke';
import { closeLayoutMenu } from '~/common/layout/store-applayout';
import { useUICounter } from '~/common/state/store-ui';

import { useChatShowSystemMessages } from '../../store-app-chat';


export function ChatMenuItems(props: {
  conversationId: string | null, isConversationEmpty: boolean, hasConversations: boolean,
  isMessageSelectionMode: boolean, setIsMessageSelectionMode: (isMessageSelectionMode: boolean) => void,
  onClearConversation: (conversationId: string) => void,
  onDuplicateConversation: (conversationId: string) => void,
  onExportConversation: (conversationId: string | null) => void,
  onFlattenConversation: (conversationId: string) => void,
}) {

  // external state
  const { touch: shareTouch } = useUICounter('export-share');
  const [showSystemMessages, setShowSystemMessages] = useChatShowSystemMessages();

  // derived state
  const disabled = !props.conversationId || props.isConversationEmpty;

  const handleSystemMessagesToggle = () => setShowSystemMessages(!showSystemMessages);

  const handleConversationExport = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    closeLayoutMenu();
    props.onExportConversation(!disabled ? props.conversationId : null);
    shareTouch();
  };

  const handleConversationDuplicate = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    closeLayoutMenu();
    props.conversationId && props.onDuplicateConversation(props.conversationId);
  };

  const handleConversationFlatten = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    closeLayoutMenu();
    props.conversationId && props.onFlattenConversation(props.conversationId);
  };

  const handleToggleMessageSelectionMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeLayoutMenu();
    props.setIsMessageSelectionMode(!props.isMessageSelectionMode);
  };

  const handleConversationClear = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    props.conversationId && props.onClearConversation(props.conversationId);
  };

  return <>

    {/*<ListItem>*/}
    {/*  <Typography level='body-sm'>*/}
    {/*    Conversation*/}
    {/*  </Typography>*/}
    {/*</ListItem>*/}

    <MenuItem onClick={handleSystemMessagesToggle}>
      <ListItemDecorator><SettingsSuggestIcon /></ListItemDecorator>
      System message
      <Switch checked={showSystemMessages} onChange={handleSystemMessagesToggle} sx={{ ml: 'auto' }} />
    </MenuItem>

    <ListDivider inset='startContent' />

    <MenuItem disabled={disabled} onClick={handleConversationDuplicate}>
      <ListItemDecorator>
        {/*<Badge size='sm' color='success'>*/}
        <ForkRightIcon color='success' />
        {/*</Badge>*/}
      </ListItemDecorator>
      Duplicate
    </MenuItem>

    <MenuItem disabled={disabled} onClick={handleConversationFlatten}>
      <ListItemDecorator>
        {/*<Badge size='sm' color='success'>*/}
        <CompressIcon color='success' />
        {/*</Badge>*/}
      </ListItemDecorator>
      Flatten
    </MenuItem>

    <ListDivider inset='startContent' />

    <MenuItem disabled={disabled} onClick={handleToggleMessageSelectionMode}>
      <ListItemDecorator>{props.isMessageSelectionMode ? <CheckBoxOutlinedIcon /> : <CheckBoxOutlineBlankOutlinedIcon />}</ListItemDecorator>
      <span style={props.isMessageSelectionMode ? { fontWeight: 800 } : {}}>
        Cleanup ...
      </span>
    </MenuItem>

    <MenuItem disabled={!props.hasConversations} onClick={handleConversationExport}>
      <ListItemDecorator>
        <FileDownloadIcon />
      </ListItemDecorator>
      Share / Export ...
    </MenuItem>

    <MenuItem disabled={disabled} onClick={handleConversationClear}>
      <ListItemDecorator><ClearIcon /></ListItemDecorator>
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        Reset
        {!disabled && <KeyStroke combo='Ctrl + Alt + X' />}
      </Box>
    </MenuItem>

  </>;
}