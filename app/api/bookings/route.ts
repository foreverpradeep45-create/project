import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getItemType,
  getTodayMalaysiaIso,
  isValidItem,
  isValidSlot,
  type BookingDTO,
  type BookingStatus,
  type ItemType,
} from '@/lib/bookings';

function serializeBooking(record: {
  id: string;
  nama_pemohon: string;
  item_tempahan: string;
  jenis_item: string;
  tarikh: string;
  slot_masa: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): BookingDTO {
  return {
    id: record.id,
    nama_pemohon: record.nama_pemohon,
    item_tempahan: record.item_tempahan,
    jenis_item: record.jenis_item as ItemType,
    tarikh: record.tarikh,
    slot_masa: record.slot_masa,
    status: record.status as BookingStatus,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET() {
  try {
    const records = await prisma.booking.findMany({
      orderBy: [{ tarikh: 'desc' }, { slot_masa: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      bookings: records.map(serializeBooking),
      today: getTodayMalaysiaIso(),
    });
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json(
      {
        error:
          'Pangkalan data PostgreSQL belum disambungkan atau jadual belum dijana. Sila semak DATABASE_URL dan jalankan npx prisma db push.',
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const namaPemohon =
      typeof body.nama_pemohon === 'string' ? body.nama_pemohon.trim() : '';
    const itemTempahan =
      typeof body.item_tempahan === 'string' ? body.item_tempahan.trim() : '';
    const tarikh = typeof body.tarikh === 'string' ? body.tarikh.trim() : '';
    const slotMasa =
      typeof body.slot_masa === 'string' ? body.slot_masa.trim() : '';

    if (namaPemohon.length < 2 || namaPemohon.length > 120) {
      return NextResponse.json(
        { error: 'Sila masukkan nama pemohon yang sah (2–120 aksara).' },
        { status: 400 }
      );
    }

    if (!isValidItem(itemTempahan)) {
      return NextResponse.json(
        { error: 'Item tempahan yang dipilih tidak sah.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(tarikh)) {
      return NextResponse.json(
        { error: 'Format tarikh tidak sah (jangkaan YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    if (!isValidSlot(slotMasa)) {
      return NextResponse.json(
        { error: 'Slot masa yang dipilih tidak sah.' },
        { status: 400 }
      );
    }

    const existingConflict = await prisma.booking.findFirst({
      where: {
        item_tempahan: itemTempahan,
        tarikh,
        slot_masa: slotMasa,
        status: { not: 'Ditolak' },
      },
    });

    if (existingConflict) {
      return NextResponse.json(
        {
          error:
            'Slot masa tersebut telah ditempah untuk item dan tarikh yang dipilih.',
        },
        { status: 409 }
      );
    }

    const newId = `TMP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const created = await prisma.booking.create({
      data: {
        id: newId,
        nama_pemohon: namaPemohon,
        item_tempahan: itemTempahan,
        jenis_item: getItemType(itemTempahan),
        tarikh,
        slot_masa: slotMasa,
        status: 'Menunggu',
      },
    });

    return NextResponse.json(
      {
        message: `Tempahan baru berjaya didaftarkan (${created.id}).`,
        booking: serializeBooking(created),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json(
      { error: 'Gagal menyimpan tempahan baru.' },
      { status: 500 }
    );
  }
}
