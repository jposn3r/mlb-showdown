// Auto-generated master card index
import type { PlayerCard } from '../../types';
import { nyyCards } from './teams/nyy';
import { bosCards } from './teams/bos';
import { torCards } from './teams/tor';
import { balCards } from './teams/bal';
import { tbCards } from './teams/tb';
import { cleCards } from './teams/cle';
import { minCards } from './teams/min';
import { detCards } from './teams/det';
import { cwsCards } from './teams/cws';
import { kcCards } from './teams/kc';
import { houCards } from './teams/hou';
import { seaCards } from './teams/sea';
import { texCards } from './teams/tex';
import { laaCards } from './teams/laa';
import { oakCards } from './teams/oak';
import { atlCards } from './teams/atl';
import { phiCards } from './teams/phi';
import { nymCards } from './teams/nym';
import { miaCards } from './teams/mia';
import { wshCards } from './teams/wsh';
import { milCards } from './teams/mil';
import { chcCards } from './teams/chc';
import { stlCards } from './teams/stl';
import { pitCards } from './teams/pit';
import { cinCards } from './teams/cin';
import { ladCards } from './teams/lad';
import { sdCards } from './teams/sd';
import { ariCards } from './teams/ari';
import { sfCards } from './teams/sf';
import { colCards } from './teams/col';

export const allCards: PlayerCard[] = [
  ...nyyCards,
  ...bosCards,
  ...torCards,
  ...balCards,
  ...tbCards,
  ...cleCards,
  ...minCards,
  ...detCards,
  ...cwsCards,
  ...kcCards,
  ...houCards,
  ...seaCards,
  ...texCards,
  ...laaCards,
  ...oakCards,
  ...atlCards,
  ...phiCards,
  ...nymCards,
  ...miaCards,
  ...wshCards,
  ...milCards,
  ...chcCards,
  ...stlCards,
  ...pitCards,
  ...cinCards,
  ...ladCards,
  ...sdCards,
  ...ariCards,
  ...sfCards,
  ...colCards,
];

export const getCardsByTeam = (teamAbbr: string): PlayerCard[] =>
  allCards.filter(c => c.team === teamAbbr);

export const getCardById = (id: string): PlayerCard | undefined =>
  allCards.find(c => c.id === id);
