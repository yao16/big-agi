import * as React from 'react';

import { Box, Button, Card, CardContent, Container, IconButton, Typography } from '@mui/joy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { Brand } from '~/common/app.config';
import { Link } from '~/common/components/Link';
import { capitalizeFirstLetter } from '~/common/util/textUtils';

import { newsCallout, NewsItems } from './news.data';
import { ROUTE_APP_CHAT } from '~/common/app.routes';


export function AppNews() {
  // state
  const [lastNewsIdx, setLastNewsIdx] = React.useState<number>(0);

  // news selection
  const news = NewsItems.filter((_, idx) => idx <= lastNewsIdx);
  const firstNews = news[0] ?? null;

  return (

    <Box sx={{
      flexGrow: 1,
      backgroundColor: 'background.level1',
      overflowY: 'auto',
      display: 'flex', justifyContent: 'center',
      p: { xs: 3, md: 6 },
    }}>

      <Box sx={{
        my: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 4,
      }}>

        <Typography level='h1' sx={{ fontSize: '3rem' }}>
          Welcome to {Brand.Title.Base} {firstNews?.versionName}!
        </Typography>

        <Typography>
          {capitalizeFirstLetter(Brand.Title.Base)} has been updated to version {firstNews?.versionName}.
        </Typography>

        <Box>
          <Button
            variant='solid' color='neutral' size='lg'
            component={Link} href={ROUTE_APP_CHAT} noLinkStyle
            endDecorator='✨'
            sx={{ minWidth: 200 }}
          >
            Sweet
          </Button>
        </Box>

        {!!newsCallout && <Container disableGutters maxWidth='sm'>{newsCallout}</Container>}

        {!!news && <Container disableGutters maxWidth='sm'>
          {news?.map((ni, idx) => {
            const firstCard = idx === 0;
            const hasCardAfter = news.length < NewsItems.length;
            const showExpander = hasCardAfter && (idx === news.length - 1);
            const addPadding = !firstCard; // || showExpander;
            return <Card key={'news-' + idx} sx={{ mb: 2, minHeight: 32 }}>
              <CardContent sx={{ position: 'relative', pr: addPadding ? 4 : 0 }}>
                {!!ni.text && <Typography level='title-lg' component='div'>
                  {ni.text}
                </Typography>}

                {!!ni.items && (ni.items.length > 0) && <ul style={{ marginTop: 8, marginBottom: 8, paddingInlineStart: 24 }}>
                  {ni.items.map((item, idx) => <li key={idx}>
                    <Typography component='div'>
                      {item.text}
                    </Typography>
                  </li>)}
                </ul>}

                {/*!firstCard &&*/ (
                  <Typography level='body-sm' sx={{ position: 'absolute', right: 0, top: 0 }}>
                    {ni.versionName}
                  </Typography>
                )}

                {showExpander && (
                  <IconButton
                    variant='plain' size='sm'
                    onClick={() => setLastNewsIdx(idx + 1)}
                    sx={{ position: 'absolute', right: 0, bottom: 0, mr: -1, mb: -1 }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                )}

              </CardContent>
            </Card>;
          })}
        </Container>}

        {/*<Typography sx={{ textAlign: 'center' }}>*/}
        {/*  Enjoy!*/}
        {/*  <br /><br />*/}
        {/*  -- The {Brand.Title.Base} Team*/}
        {/*</Typography>*/}

      </Box>

    </Box>
  );
}