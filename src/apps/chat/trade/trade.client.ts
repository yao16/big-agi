import { fileSave } from 'browser-fs-access';

import { defaultSystemPurposeId, SystemPurposes } from '../../../data';

import { DModelSource, useModelsStore } from '~/modules/llms/store-llms';

import { DConversation, useChatStore } from '~/common/state/store-chats';
import { prettyBaseModel } from '~/common/util/modelUtils';

import { ImportedOutcome } from './ImportOutcomeModal';


/**
 * Restores all conversations in a JSON
 *  - supports both ExportedConversationJsonV1, and ExportedAllJsonV1 files
 */
export function loadAllConversationsFromJson(fileName: string, obj: any, outcome: ImportedOutcome) {
  // heuristics
  const hasConversations = obj.hasOwnProperty('conversations');
  const hasMessages = obj.hasOwnProperty('messages');

  // parse ExportedAllJsonV1
  if (hasConversations && !hasMessages) {
    const payload = obj as ExportedAllJsonV1;
    for (let conversation of payload.conversations)
      loadConversationFromJson(fileName, conversation, outcome);
  }
  // parse ExportedConversationJsonV1
  else if (hasMessages && !hasConversations) {
    loadConversationFromJson(fileName, obj as ExportedConversationJsonV1, outcome);
  }
  // invalid
  else {
    outcome.conversations.push({ success: false, fileName, error: `Invalid file: ${fileName}` });
  }
}

function loadConversationFromJson(fileName: string, part: Partial<DConversation>, outcome: ImportedOutcome) {
  if (!part || !part.id || !part.messages) {
    outcome.conversations.push({ success: false, fileName, error: `Invalid conversation: ${part.id}` });
    return;
  }
  const restored: DConversation = {
    id: part.id,
    messages: part.messages,
    systemPurposeId: part.systemPurposeId || defaultSystemPurposeId,
    ...(part.userTitle && { userTitle: part.userTitle }),
    ...(part.autoTitle && { autoTitle: part.autoTitle }),
    tokenCount: part.tokenCount || 0,
    created: part.created || Date.now(),
    updated: part.updated || Date.now(),
    // add these back - these fields are not exported
    abortController: null,
    ephemerals: [],
  };
  outcome.conversations.push({ success: true, fileName, conversation: restored });
}


/**
 * Download all conversations as a JSON file, for backup and future restore
 * @throws {Error} if the user closes the dialog, or file could not be saved
 */
export async function downloadAllConversationsJson() {
  // conversations and
  const payload: ExportedAllJsonV1 = {
    conversations: useChatStore.getState().conversations.map(cleanConversationForExport),
    models: { sources: useModelsStore.getState().sources },
  };
  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: 'application/json' });

  // link to begin the download
  const isoDate = new Date().toISOString().replace(/:/g, '-');
  await fileSave(blob, { fileName: `conversations-${isoDate}.json`, extensions: ['.json'] });
}


/**
 * Download a conversation as a JSON file, for backup and future restore
 * @throws {Error} if the user closes the dialog, or file could not be saved
 */
export async function downloadConversationJson(conversation: DConversation) {
  // remove fields from the export
  const exportableConversation: ExportedConversationJsonV1 = cleanConversationForExport(conversation);
  const json = JSON.stringify(exportableConversation, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  // link to begin the download
  await fileSave(blob, { fileName: `conversation-${conversation.id}.json`, extensions: ['.json'] });
}

function cleanConversationForExport(_conversation: DConversation): Partial<DConversation> {
  // remove fields from the export
  const { abortController, ephemerals, ...conversation } = _conversation;
  return conversation;
}


/**
 * Primitive rendering of a Conversation to Markdown
 */
export function conversationToMarkdown(conversation: DConversation, hideSystemMessage: boolean): string {

  // const title =
  //   `# ${conversation.manual/auto/name || 'Conversation'}\n` +
  //   (new Date(conversation.created)).toLocaleString() + '\n\n';

  return conversation.messages.filter(message => !hideSystemMessage || message.role !== 'system').map(message => {
    let sender: string = message.sender;
    let text = message.text;
    switch (message.role) {
      case 'system':
        sender = '✨ System message';
        text = '<img src="https://i.giphy.com/media/jJxaUysjzO9ri/giphy.webp" width="48" height="48" alt="typing fast meme"/>\n\n' + '*' + text + '*';
        break;
      case 'assistant':
        const purpose = message.purposeId || conversation.systemPurposeId || null;
        sender = `${purpose || 'Assistant'} · *${prettyBaseModel(message.originLLM || '')}*`.trim();
        if (purpose && purpose in SystemPurposes)
          sender = `${SystemPurposes[purpose]?.symbol || ''} ${sender}`.trim();
        break;
      case 'user':
        sender = '👤 You';
        break;
    }
    return `### ${sender}\n\n${text}\n\n`;
  }).join('---\n\n');

}


/// do not change these - consider people's backups

type ExportedConversationJsonV1 = Partial<DConversation>;

type ExportedAllJsonV1 = {
  conversations: ExportedConversationJsonV1[];
  models: { sources: DModelSource[] };
}