import BookingDashboard from '@/components/BookingDashboard';
import {
  getTodayMalaysiaIso,
  type BookingDTO,
  type BookingStatus,
  type ItemType,
} from '@/lib/bookings';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const today = getTodayMalaysiaIso();
  let initialBookings: BookingDTO[] = [];
  let initialError: string | null = null;

  try {
    const records = await prisma.booking.findMany({
      orderBy: [{ tarikh: 'desc' }, { slot_masa: 'asc' }, { createdAt: 'desc' }],
    });

    initialBookings = records.map((record) => ({
      id: record.id,
      nama_pemohon: record.nama_pemohon,
      item_tempahan: record.item_tempahan,
      jenis_item: record.jenis_item as ItemType,
      tarikh: record.tarikh,
      slot_masa: record.slot_masa,
      status: record.status as BookingStatus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('HomePage Prisma query error:', error);
    initialError =
      'Pangkalan data PostgreSQL belum disambungkan atau jadual belum dijana. Tetapkan DATABASE_URL dalam .env dan jalankan npx prisma db push serta npx prisma db seed.';
  }

  return (
    <BookingDashboard
      initialBookings={initialBookings}
      initialToday={today}
      initialError={initialError}
    />
  );
}
