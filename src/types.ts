import { Enum } from './utils/enum';

// Param types
const gunTypes = Enum(
  'Glock-18',
  'M4A4',
  'AK-47',
  'AWP',
  'Desert Eagle',
  'Souvenir MP5-SD'
);

type GunType = keyof typeof gunTypes;

const exteriorTypes = Enum(
  'Battle-Scarred',
  'Well-Worn',
  'Field-Tested',
  'Minimal Wear',
  'Factory New'
);

type ExteriorType = keyof typeof exteriorTypes;

export type Skin = {
  isStatTrak: boolean;
  type: GunType;
  theme: string;
  exterior: ExteriorType;
};

export type Pagination = {
  start: number;
  count: number;
  totalCount: number;
  currentPage: number;
  pages: number;
};

// Response types
export type SteamResponseBody = {
  app_data: any;
  assets: any;
  currency: any;
  hovers: any;
  listinginfo: {
    [id: string]: {
      asset: {
        id: string;
        market_actions: {
          link: string;
          name: string;
        }[];
      };
      converted_price: number;
    };
  };
  total_count: number;
} & Record<string, any>;

export type FloatResponseBody = {
  iteminfo: {
    accountid?: any;
    itemid: string;
    defindex: number;
    paintindex: number;
    rarity: number;
    quality: number;
    paintseed: number;
    killeaterscoretype: number;
    killeatervalue: number;
    customname?: any;
    stickers: any[];
    inventory: number;
    origin: number;
    questid?: any;
    dropreason?: any;
    musicindex?: any;
    s: string;
    a: string;
    d: string;
    m: string;
    floatvalue: number;
    imageurl: string;
    min: number;
    max: number;
    weapon_type: string;
    item_name: string;
    rarity_name: string;
    quality_name: string;
    origin_name: string;
    wear_name: string;
    full_item_name: string;
  };
  price?: number;
  success: boolean;
};
