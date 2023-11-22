//
// Application Routes
//
// We will centralize them here, for UI and routing purposes.
//

import Router from 'next/router';

export const ROUTE_APP_CHAT = '/';
const APP_LINK_CHAT = '/link/chat/:linkId';
const APP_LABS = '/labs';

export const getHomeLink = () => ROUTE_APP_CHAT;

export const getChatLinkRelativePath = (chatLinkId: string) => APP_LINK_CHAT.replace(':linkId', chatLinkId);

export const navigateToChat = async () => await Router.push(ROUTE_APP_CHAT);

export const navigateToLabs = async () => await Router.push(APP_LABS);

export const navigateBack = Router.back;

export interface AppCallQueryParams {
  conversationId: string;
  personaId: string;
}

export function launchAppCall(conversationId: string, personaId: string) {
  void Router.push(
    {
      pathname: `/call`,
      query: {
        conversationId,
        personaId,
      } satisfies AppCallQueryParams,
    },
    // '/call',
  ).then();
}