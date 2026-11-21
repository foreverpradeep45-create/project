import { PrismaClient } from '@prisma/client';
import { getItemType, getTodayMalaysiaIso, offsetIsoDate } from '../lib/bookings';

const prisma = new PrismaClient();

async function main() {
  const existingCount = await prisma.booking.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} booking records. Skipping seed.`);
    return;
  }

  const today = getTodayMalaysiaIso();

  const seedRows = [
    {
      id: 'TMP-A104F2B1',
      nama_pemohon: 'Ahmad Faiz bin Roslan',
      item_tempahan: 'Bilik Perbincangan 1',
      tarikh: today,
      slot_masa: '8:00-10:00',
      status: 'Menunggu',
    },
    {
      id: 'TMP-B209C4D3',
      nama_pemohon: 'Nurul Aisyah binti Zulkifli',
      item_tempahan: 'Makmal Komputer 1',
      tarikh: today,
      slot_masa: '10:00-12:00',
      status: 'Diluluskan',
    },
    {
      id: 'TMP-C318E6F5',
      nama_pemohon: 'Tan Wei Ming',
      item_tempahan: 'Kamera DSLR',
      tarikh: today,
      slot_masa: '14:00-16:00',
      status: 'Menunggu',
    },
    {
      id: 'TMP-D427A8B7',
      nama_pemohon: 'Kavitha a/p Subramaniam',
      item_tempahan: 'Bola Futsal',
      tarikh: today,
      slot_masa: '16:00-18:00',
      status: 'Ditolak',
    },
    {
      id: 'TMP-E536C9D9',
      nama_pemohon: 'Muhammad Haziq bin Ismail',
      item_tempahan: 'Bilik Perbincangan 2',
      tarikh: offsetIsoDate(today, 1),
      slot_masa: '8:00-10:00',
      status: 'Diluluskan',
    },
    {
      id: 'TMP-F645E1F2',
      nama_pemohon: 'Siti Sarah binti Abdullah',
      item_tempahan: 'Tripod',
      tarikh: offsetIsoDate(today, 1),
      slot_masa: '10:00-12:00',
      status: 'Menunggu',
    },
    {
      id: 'TMP-G754A3B4',
      nama_pemohon: 'Lim Jia Hao',
      item_tempahan: 'Makmal Komputer 2',
      tarikh: offsetIsoDate(today, 2),
      slot_masa: '14:00-16:00',
      status: 'Diluluskan',
    },
    {
      id: 'TMP-H863C5D6',
      nama_pemohon: 'Farah Nadia binti Kamal',
      item_tempahan: 'Raket Badminton',
      tarikh: offsetIsoDate(today, 2),
      slot_masa: '16:00-18:00',
      status: 'Menunggu',
    },
    {
      id: 'TMP-J972E7F8',
      nama_pemohon: 'Amirul Hakim bin Razak',
      item_tempahan: 'Kamera DSLR',
      tarikh: offsetIsoDate(today, -1),
      slot_masa: '10:00-12:00',
      status: 'Diluluskan',
    },
  ].map((row) => ({
    ...row,
    jenis_item: getItemType(row.item_tempahan),
  }));

  await prisma.booking.createMany({
    data: seedRows,
  });

  console.log(`Seeded ${seedRows.length} Malaysian campus booking records.`);
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
