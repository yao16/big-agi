import * as React from 'react';
import { useRouter } from 'next/router';

import { Alert, Box, Button, Typography } from '@mui/joy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { useComposerStore } from '../src/apps/chat/components/composer/store-composer';

import { AppLayout } from '~/common/layout/AppLayout';
import { LogoProgress } from '~/common/components/LogoProgress';
import { asValidURL } from '~/common/util/urlUtils';


/**
 * This page will be invoked on mobile when sharing Text/URLs/Files from other APPs
 * See the /public/manifest.json for how this is configured. Parameters:
 *  - text: the text to share
 *  - url: the URL to share
 *   - if the URL is a valid URL, it will be downloaded and the content will be shared
 *   - if the URL is not a valid URL, it will be shared as text
 *  - title: the title of the shared content
 */
function AppShareTarget() {
  // state
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [intentText, setIntentText] = React.useState<string | null>(null);
  const [intentURL, setIntentURL] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // external state
  const { query, push: routerPush, replace: routerReplace } = useRouter();


  const queueComposerTextAndLaunchApp = React.useCallback((text: string) => {
    useComposerStore.getState().setStartupText(text);
    routerReplace('/').then(() => null);
  }, [routerReplace]);


  // Detect the share Intent from the query
  React.useEffect(() => {
    // skip when query is not parsed yet
    if (!Object.keys(query).length)
      return;

    // single item from the query
    let queryTextItem: string[] | string | null = query.url || query.text || null;
    if (Array.isArray(queryTextItem))
      queryTextItem = queryTextItem[0];

    // check if the item is a URL
    const url = asValidURL(queryTextItem);
    if (url)
      setIntentURL(url);
    else if (queryTextItem)
      setIntentText(queryTextItem);
    else
      setErrorMessage('No text or url. Received: ' + JSON.stringify(query));

  }, [query.url, query.text, query]);


  // Text -> Composer
  React.useEffect(() => {
    if (intentText)
      queueComposerTextAndLaunchApp(intentText);
  }, [intentText, queueComposerTextAndLaunchApp]);


  // URL -> download -> Composer
  React.useEffect(() => {
    if (intentURL) {
      setIsDownloading(true);
      // TEMP: until the Browse module is ready, just use the URL, verbatim
      queueComposerTextAndLaunchApp(intentURL);
      setIsDownloading(false);
      /*callBrowseFetchSinglePage(intentURL)
        .then(pageContent => {
          if (pageContent)
            queueComposerTextAndLaunchApp('\n\n```' + intentURL + '\n' + pageContent + '\n```\n');
          else
            setErrorMessage('Could not read any data');
        })
        .catch(error => setErrorMessage(error?.message || error || 'Unknown error'))
        .finally(() => setIsDownloading(false));*/
    }
  }, [intentURL, queueComposerTextAndLaunchApp]);


  return (

    <Box sx={{
      backgroundColor: 'background.level2',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      flexGrow: 1,
    }}>

      {/* Logo with Circular Progress  */}
      <LogoProgress showProgress={isDownloading} />

      {/* Title */}
      <Typography level='title-lg' sx={{ mt: 2, mb: 1 }}>
        {isDownloading ? 'Loading...' : errorMessage ? '' : intentURL ? 'Done' : 'Receiving...'}
      </Typography>

      {/* Possible Error */}
      {errorMessage && <>
        <Alert variant='soft' color='danger' sx={{ my: 1 }}>
          <Typography>{errorMessage}</Typography>
        </Alert>
        <Button
          variant='solid' color='danger'
          onClick={() => routerPush('/')}
          endDecorator={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Cancel
        </Button>
      </>}

      {/* URL under analysis */}
      <Typography level='body-xs'>
        {intentURL}
      </Typography>
    </Box>

  );

}

/**
 * This page will be invoked on mobile when sharing Text/URLs/Files from other APPs
 * Example URL: https://get.big-agi.com/launch?title=This+Title&text=https%3A%2F%2Fexample.com%2Fapp%2Fpath
 */
export default function LaunchPage() {
  return (
    <AppLayout>
      <AppShareTarget />
    </AppLayout>
  );
}