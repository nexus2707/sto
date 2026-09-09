/**
 * Predefined Shop Locations, User Emails, Sheet Names, and Challan Prefixes
 */

export interface ShopMapping {
  email: string;
  locationName: string;
  sheetName: string;
  prefix: string;
  name: string;
  role: 'admin' | 'creator';
}

export const PREDEFINED_SHOP_MAPPINGS: ShopMapping[] = [
  {
    email: 'hr.rftcom@gmail.com',
    locationName: 'A1-SHOP NO1',
    sheetName: 'kin-sh1',
    prefix: 'Shop01/',
    name: 'Easy Flow Administrator',
    role: 'admin'
  },
  {
    email: 'itkin.rft@gmail.com',
    locationName: 'A6-SHOP NO6',
    sheetName: 'kin-sh6',
    prefix: 'Shop06/',
    name: 'IT Kin RFT (A6-SHOP NO6)',
    role: 'creator'
  },
  {
    email: 'kfkcongo@gmail.com',
    locationName: 'A9-SHOP-KFK9',
    sheetName: 'kin-sh9',
    prefix: 'Shop09/',
    name: 'KFK Congo (A9-SHOP-KFK9)',
    role: 'creator'
  },
  {
    email: 'kiyafinformatique786@gmail.com',
    locationName: 'A7-SHOP NO7',
    sheetName: 'kin-sh7',
    prefix: 'Shop07/',
    name: 'Kiyaf Informatique (A7-SHOP NO7)',
    role: 'creator'
  },
  {
    email: 'najmainformatique17@gmail.com',
    locationName: 'A2-SHOP NO2',
    sheetName: 'kin-sh2',
    prefix: 'Shop02/',
    name: 'Najma Informatique (A2-SHOP NO2)',
    role: 'creator'
  },
  {
    email: 'nskinformatic38@gmail.com',
    locationName: 'A3-SHOP NO3',
    sheetName: 'kin-sh3',
    prefix: 'Shop03/',
    name: 'NSK Informatic (A3-SHOP NO3)',
    role: 'creator'
  },
  {
    email: 'itinformatique360@gmail.com',
    locationName: 'AA12-SHOP NO12',
    sheetName: 'kin-sh12',
    prefix: 'Shop12/',
    name: 'IT Informatique 360 (AA12-SHOP NO12)',
    role: 'creator'
  },
  {
    email: 'informaticcity427@gmail.com',
    locationName: 'A5-SHOP NO5',
    sheetName: 'kin-sh5',
    prefix: 'Shop05/',
    name: 'Informatic City (A5-SHOP NO5)',
    role: 'creator'
  },
  {
    email: 'computercitykin777@gmail.com',
    locationName: 'AA13-SHOP NO13',
    sheetName: 'kin-sh13',
    prefix: 'Shop13/',
    name: 'Computer City Kin (AA13-SHOP NO13)',
    role: 'creator'
  },
  {
    email: 'kiyainformatiq777@gmail.com',
    locationName: 'A4-SHOP NO4',
    sheetName: 'kin-sh4',
    prefix: 'Shop04/',
    name: 'Kiyainformatiq (A4-SHOP NO4)',
    role: 'creator'
  },
  {
    email: 'kiyainformatiq7777@gmail.com',
    locationName: 'A4-SHOP NO4',
    sheetName: 'kin-sh4',
    prefix: 'Shop04/',
    name: 'Kiyainformatiq 7777 (A4-SHOP NO4)',
    role: 'creator'
  },
  {
    email: 'itelrft@gmail.com',
    locationName: 'A8-SHOP NO8',
    sheetName: 'kin-sh8',
    prefix: 'Shop08/',
    name: 'Itel RFT (A8-SHOP NO8)',
    role: 'creator'
  },
  {
    email: 'kksmart337@gmail.com',
    locationName: 'AA10SHOP NO-10',
    sheetName: 'kin-sh10',
    prefix: 'Shop10/',
    name: 'KK Smart (AA10SHOP NO-10)',
    role: 'creator'
  },
  {
    email: 'najmainformatique12@gmail.com',
    locationName: 'AA11-SHOP NO11',
    sheetName: 'kin-sh11',
    prefix: 'Shop11/',
    name: 'Najma Informatique 12 (AA11-SHOP NO11)',
    role: 'creator'
  },
  {
    email: 'nazmaelectronics108@gmail.com',
    locationName: 'A1-SHOP NO1',
    sheetName: 'kin-sh1',
    prefix: 'Shop01/',
    name: 'Nazma Electronics (A1-SHOP NO1)',
    role: 'creator'
  },
  {
    email: 'itkinshasa1@gmail.com',
    locationName: 'A1-SHOP NO1',
    sheetName: 'kin-sh1',
    prefix: 'Shop01/',
    name: 'A1 Operations',
    role: 'creator'
  }
];

export const PREDEFINED_SHOP_CONFIGS = PREDEFINED_SHOP_MAPPINGS;

export const LOCATION_CHALLAN_PREFIXES: Record<string, string> = {
  'A8-SHOP NO8': 'Shop08/',
  'A6-SHOP NO6': 'Shop06/',
  'A7-SHOP NO7': 'Shop07/',
  'A9-SHOP-KFK9': 'Shop09/',
  'A2-SHOP NO2': 'Shop02/',
  'A3-SHOP NO3': 'Shop03/',
  'A5-SHOP NO5': 'Shop05/',
  'A4-SHOP NO4': 'Shop04/',
  'AA12-SHOP NO12': 'Shop12/',
  'AA13-SHOP NO13': 'Shop13/',
  'AA10SHOP NO-10': 'Shop10/',
  'AA11-SHOP NO11': 'Shop11/',
  'A1-SHOP NO1': 'Shop01/',
  'Buro': 'Buro/'
};

export const LOCATION_SHEET_NAMES: Record<string, string> = {
  'A1-SHOP NO1': 'kin-sh1',
  'A2-SHOP NO2': 'kin-sh2',
  'A3-SHOP NO3': 'kin-sh3',
  'A4-SHOP NO4': 'kin-sh4',
  'A5-SHOP NO5': 'kin-sh5',
  'A6-SHOP NO6': 'kin-sh6',
  'A7-SHOP NO7': 'kin-sh7',
  'A8-SHOP NO8': 'kin-sh8',
  'A9-SHOP-KFK9': 'kin-sh9',
  'AA10SHOP NO-10': 'kin-sh10',
  'AA11-SHOP NO11': 'kin-sh11',
  'AA12-SHOP NO12': 'kin-sh12',
  'AA13-SHOP NO13': 'kin-sh13',
  'Buro': 'buro'
};

/**
 * Find shop mapping by user email
 */
export function getShopMappingByEmail(email: string): ShopMapping | undefined {
  if (!email) return undefined;
  const clean = email.trim().toLowerCase();
  return PREDEFINED_SHOP_MAPPINGS.find(m => m.email.toLowerCase() === clean);
}

/**
 * Find shop mapping by location name (e.g. 'A2-SHOP NO2')
 */
export function getShopMappingByLocation(location: string): ShopMapping | undefined {
  if (!location) return undefined;
  const clean = location.trim().toLowerCase();
  return PREDEFINED_SHOP_MAPPINGS.find(m => m.locationName.toLowerCase() === clean);
}

/**
 * Get the Challan prefix for a location (e.g. 'A8-SHOP NO8' -> 'Shop08/')
 */
export function getChallanPrefixForLocation(location: string): string {
  if (!location) return 'Shop01/';
  const trimmed = location.trim();
  if (LOCATION_CHALLAN_PREFIXES[trimmed]) {
    return LOCATION_CHALLAN_PREFIXES[trimmed];
  }
  const match = Object.keys(LOCATION_CHALLAN_PREFIXES).find(
    k => k.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return LOCATION_CHALLAN_PREFIXES[match];

  // Try to extract shop number
  const shopNumMatch = trimmed.match(/(?:shop\s*(?:no[- ]?)?|kfk|aa?)(\d+)/i);
  if (shopNumMatch) {
    const num = parseInt(shopNumMatch[1], 10);
    const padded = num < 10 ? `0${num}` : `${num}`;
    return `Shop${padded}/`;
  }

  return 'Shop01/';
}

/**
 * Get the Google Sheet tab name for a location (e.g. 'A2-SHOP NO2' -> 'kin-sh2')
 */
export function getSheetNameForLocation(location: string): string {
  if (!location) return 'buro';
  const trimmed = location.trim();
  if (LOCATION_SHEET_NAMES[trimmed]) {
    return LOCATION_SHEET_NAMES[trimmed];
  }
  const match = Object.keys(LOCATION_SHEET_NAMES).find(
    k => k.toLowerCase() === trimmed.toLowerCase()
  );
  if (match) return LOCATION_SHEET_NAMES[match];

  // Fallback: extract shop number
  const shopNumMatch = trimmed.match(/(?:shop\s*(?:no[- ]?)?|kfk|aa?)(\d+)/i);
  if (shopNumMatch) {
    return `kin-sh${shopNumMatch[1]}`;
  }

  return 'buro';
}

/**
 * Generate next sequential Challan number for a location, e.g. "Shop08/01", "Shop08/02"
 */
export function generateNextChallanNo(sourceLocation: string, existingChallanNos: string[]): string {
  const prefix = getChallanPrefixForLocation(sourceLocation);
  let maxNum = 0;

  existingChallanNos.forEach(cNo => {
    if (!cNo) return;
    const clean = cNo.trim();
    if (clean.toLowerCase().startsWith(prefix.toLowerCase())) {
      const numPart = clean.slice(prefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  });

  const nextSeq = maxNum + 1;
  const formattedSeq = nextSeq < 10 ? `0${nextSeq}` : `${nextSeq}`;
  return `${prefix}${formattedSeq}`;
}

/**
 * Verify if email belongs to predefined authorized list
 */
export function isPredefinedAuthorizedEmail(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return PREDEFINED_SHOP_MAPPINGS.some(m => m.email.toLowerCase() === clean);
}
