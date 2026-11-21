export const ROOM_ITEMS = [
  'Bilik Perbincangan 1',
  'Bilik Perbincangan 2',
  'Makmal Komputer 1',
  'Makmal Komputer 2',
] as const;

export const EQUIPMENT_ITEMS = [
  'Kamera DSLR',
  'Tripod',
  'Bola Futsal',
  'Raket Badminton',
] as const;

export const ALL_ITEMS = [...ROOM_ITEMS, ...EQUIPMENT_ITEMS] as const;

export const VALID_SLOTS = [
  '8:00-10:00',
  '10:00-12:00',
  '14:00-16:00',
  '16:00-18:00',
] as const;

export const VALID_STATUSES = [
  'Menunggu',
  'Diluluskan',
  'Ditolak',
] as const;

export type BookingItem = (typeof ALL_ITEMS)[number];
export type BookingSlot = (typeof VALID_SLOTS)[number];
export type BookingStatus = (typeof VALID_STATUSES)[number];
export type ItemType = 'Ruang' | 'Peralatan';

export interface BookingDTO {
  id: string;
  nama_pemohon: string;
  item_tempahan: string;
  jenis_item: ItemType;
  tarikh: string;
  slot_masa: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export function getItemType(item: string): ItemType {
  return (ROOM_ITEMS as readonly string[]).includes(item) ? 'Ruang' : 'Peralatan';
}

export function isValidItem(item: string): item is BookingItem {
  return (ALL_ITEMS as readonly string[]).includes(item);
}

export function isValidSlot(slot: string): slot is BookingSlot {
  return (VALID_SLOTS as readonly string[]).includes(slot);
}

export function isValidStatus(status: string): status is BookingStatus {
  return (VALID_STATUSES as readonly string[]).includes(status);
}

export function getTodayMalaysiaIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function offsetIsoDate(baseIso: string, daysOffset: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}
