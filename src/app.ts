import axios from 'axios';
import fs from 'fs';

const STATTRAK = 'StatTrak%E2%84%A2%20';

type GunType = {

}

const exteriorTypes = Object.freeze({
  'Battle-Scarred': 'Battle-Scarred',
  'Well-Worn': 'Well-Worn',
  'Field-Tested': 'Field-Tested',
  'Minimal Wear': 'Minimal Wear',
  'Factory New': 'Factory New',
})

type ExteriorType = keyof typeof exteriorTypes;

// search params
const skin: Skin = {
  isStatTrak: true,
  type: 'Desert Eagle',
  theme: 'Bronze Deco',
  exterior: 'Factory New',
}

const currentTime = new Date()

const t = {
  year: currentTime.getFullYear(),
  month: currentTime.getMonth(),
  day: currentTime.getDate(),
  hour: currentTime.getHours(),
  minute: currentTime.getMinutes(),
  second: currentTime.getSeconds(),
}

const formattedFileName = `./output/${t.year} ${t.month} ${t.day} - ${t.hour} ${t.minute} ${t.second} - ${skin.isStatTrak ? STATTRAK : ''}${skin.type} - ${skin.theme} (${skin.exterior}).txt`

const logger = fs.createWriteStream(formattedFileName);

logger.on('finish', () => {
  console.log(`Created file ${formattedFileName}`);
});

// pagination params
const pagination: Pagination = {
  start: 0,
  count: 100,
  totalCount: 0,
  currentPage: 0,
  pages: 0,
}

// Random number to convert price to EUR
const CONVERSION_RATE = 87;

// API
const STEAM_API_URL = `https://steamcommunity.com/market/listings/730/${skin.isStatTrak ? STATTRAK : ''}${skin.type}%20%7C%20${skin.theme}%20%28${skin.exterior}%29/render/`

const FLOAT_API_URL = 'https://floats.gainskins.com/'

// Response types
type SteamResponseBody = {
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
      },
      converted_price: number;
    };
  };
  total_count: number;
} & Record<string, any>

type FloatResponseBody = {
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
  }
  price?: number;
  success: boolean;
}

// Param types
type Skin = {
  isStatTrak: boolean;
  type: string;
  theme: string;
  exterior: ExteriorType;
}

type Pagination = {
  start: number;
  count: number;
  totalCount: number;
  currentPage: number;
  pages: number;
}

// get init totalCount
const getTotalCount = async (paginationOptions: Pagination): Promise<void> => {
  const start = 0; // start with zero
  try {

    const response = await axios.get<SteamResponseBody>(STEAM_API_URL, {
      params: {
        //query: '',
        start: start.toString(),
        count: paginationOptions.count.toString(),
        country: 'CZ',
        language: 'english',
        currency: '3', // EUR
      }
    });
    const { total_count } = response.data;

    pagination.totalCount = total_count;
    pagination.pages = Math.ceil(total_count / 100);
  } catch (e) {
    console.log(e.message)
  }
}

const getListings = async (paginationOptions: Pagination): Promise<SteamResponseBody | undefined> => {
  try {
    const response = await axios.get<SteamResponseBody>(STEAM_API_URL, {
      params: {
        query: '',
        start: paginationOptions.start.toString(),
        count: paginationOptions.count.toString(),
        country: 'CZ',
        language: 'english',
        currency: '3', // EUR
      }
    });
    return response.data;
  } catch (e) {
    logger.write('Steam API request failed' + "\r\n", 'utf8');
    console.log(e.message);
  }
}

const getSkinInfo = async (previewUrl: string, price: FloatResponseBody['price']): Promise<FloatResponseBody | undefined> => {
  try {
    const response = await axios.get<FloatResponseBody>(FLOAT_API_URL + '?url=' + previewUrl, {
    });
    if (price) {
      response.data.price = price
    }
    return response.data;
  } catch (e) {
    console.log(e.message)
  }
}

const logSkinsData = async (): Promise<void | undefined> => {
  pagination.start = 0;
  pagination.currentPage = 1;
  logger.write(`TOTAL COUNT: ${pagination.totalCount}` + "\r\n", 'utf8')
  try {
    for (pagination.currentPage; pagination.currentPage < pagination.pages + 1; pagination.currentPage++) {

      const currentPagination: string = `PAGE: [${pagination.currentPage}/${pagination.pages}]`;

      console.log(currentPagination);
      const listings = await getListings(pagination);
      const listinginfo = listings?.listinginfo;

      if (!listinginfo) {
        console.log('No listing info (getListings failed)')
        continue;
      }

      const previewLinks: { actionLink: string, price: number }[] = [];
      Object.keys(listinginfo).map(key => {
        if (listinginfo[key]) {
          const price = listinginfo[key].converted_price / CONVERSION_RATE;
          let actionLink = listinginfo[key].asset.market_actions[0].link;
          actionLink = actionLink.replace('%assetid%', listinginfo[key].asset.id);
          actionLink = actionLink.replace('%listingid%', key);
          previewLinks.push({ actionLink, price })
        }
      })

      const outputPromises: Promise<FloatResponseBody | undefined>[] = [];
      previewLinks.forEach(({ actionLink, price }) => {
        const skinInfo = getSkinInfo(actionLink, price);
        outputPromises.push(skinInfo);
      })

      const output = await Promise.all(outputPromises);
      output.forEach(output => {
        if (output && output.iteminfo) {
          let convertedPrice: string = '';
          if (output.price) convertedPrice = (output.price / CONVERSION_RATE).toFixed(2) + '€';
          logger.write(`${currentPagination} | LISTING_ID: ${output.iteminfo.m} | PRICE: ${convertedPrice} | FLOAT: ${output.iteminfo.floatvalue}` + "\r\n", "utf8")
        }
      })
      pagination.start += pagination.count;
    }
  } catch (e) {
    console.log(e.message)
  }
}

const main = async (): Promise<void> => {
  await getTotalCount(pagination); // sets pagination
  await logSkinsData();
}

(async function () {
  await main();
  logger.end();
})()


