import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  getItemType,
  isValidItem,
  isValidSlot,
  isValidStatus,
  type BookingDTO,
  type BookingStatus,
  type ItemType,
} from '@/lib/bookings';

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cleanId = id.trim();

    if (!cleanId) {
      return NextResponse.json({ error: 'ID tempahan tidak sah.' }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id: cleanId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Rekod tempahan tidak ditemui (${cleanId}).` },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const nextNama =
      typeof body.nama_pemohon === 'string'
        ? body.nama_pemohon.trim()
        : existing.nama_pemohon;
    const nextItem =
      typeof body.item_tempahan === 'string'
        ? body.item_tempahan.trim()
        : existing.item_tempahan;
    const nextTarikh =
      typeof body.tarikh === 'string' ? body.tarikh.trim() : existing.tarikh;
    const nextSlot =
      typeof body.slot_masa === 'string'
        ? body.slot_masa.trim()
        : existing.slot_masa;
    const nextStatus =
      typeof body.status === 'string' ? body.status.trim() : existing.status;

    if (nextNama.length < 2 || nextNama.length > 120) {
      return NextResponse.json(
        { error: 'Sila masukkan nama pemohon yang sah (2–120 aksara).' },
        { status: 400 }
      );
    }

    if (!isValidItem(nextItem)) {
      return NextResponse.json(
        { error: 'Item tempahan tidak sah.' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(nextTarikh)) {
      return NextResponse.json(
        { error: 'Format tarikh tidak sah.' },
        { status: 400 }
      );
    }

    if (!isValidSlot(nextSlot)) {
      return NextResponse.json(
        { error: 'Slot masa tidak sah.' },
        { status: 400 }
      );
    }

    if (!isValidStatus(nextStatus)) {
      return NextResponse.json(
        { error: 'Status tempahan tidak sah.' },
        { status: 400 }
      );
    }

    if (nextStatus !== 'Ditolak') {
      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: cleanId },
          item_tempahan: nextItem,
          tarikh: nextTarikh,
          slot_masa: nextSlot,
          status: { not: 'Ditolak' },
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            error:
              'Slot masa tersebut telah ditempah untuk item dan tarikh yang dipilih.',
          },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id: cleanId },
      data: {
        nama_pemohon: nextNama,
        item_tempahan: nextItem,
        jenis_item: getItemType(nextItem),
        tarikh: nextTarikh,
        slot_masa: nextSlot,
        status: nextStatus,
      },
    });

    return NextResponse.json({
      message: `Rekod tempahan ${cleanId} berjaya dikemaskini.`,
      booking: serializeBooking(updated),
    });
  } catch (error) {
    console.error('PATCH /api/bookings/[id] error:', error);
    return NextResponse.json(
      { error: 'Gagal mengemaskini rekod tempahan.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cleanId = id.trim();

    if (!cleanId) {
      return NextResponse.json({ error: 'ID tempahan tidak sah.' }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id: cleanId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: `Rekod tempahan tidak ditemui (${cleanId}).` },
        { status: 404 }
      );
    }

    await prisma.booking.delete({
      where: { id: cleanId },
    });

    return NextResponse.json({
      message: `Tempahan ${cleanId} telah dipadamkan.`,
      id: cleanId,
    });
  } catch (error) {
    console.error('DELETE /api/bookings/[id] error:', error);
    return NextResponse.json(
      { error: 'Gagal memadam rekod tempahan.' },
      { status: 500 }
    );
  }
}
