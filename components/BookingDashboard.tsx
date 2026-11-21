'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ALL_ITEMS,
  EQUIPMENT_ITEMS,
  ROOM_ITEMS,
  VALID_SLOTS,
  VALID_STATUSES,
  formatDisplayDate,
  type BookingDTO,
  type BookingStatus,
} from '@/lib/bookings';

interface BookingDashboardProps {
  initialBookings: BookingDTO[];
  initialToday: string;
  initialError?: string | null;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  text: string;
}

interface FormState {
  id: string;
  nama_pemohon: string;
  item_tempahan: string;
  tarikh: string;
  slot_masa: string;
  status: BookingStatus;
}

function StatusBadge({ status }: { status: BookingStatus }) {
  if (status === 'Diluluskan') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Diluluskan</span>
      </span>
    );
  }
  if (status === 'Ditolak') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 whitespace-nowrap">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Ditolak</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 whitespace-nowrap">
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Menunggu</span>
    </span>
  );
}

export default function BookingDashboard({
  initialBookings,
  initialToday,
  initialError = null,
}: BookingDashboardProps) {
  const [bookings, setBookings] = useState<BookingDTO[]>(initialBookings);
  const [today, setToday] = useState<string>(initialToday);
  const [dbError, setDbError] = useState<string | null>(initialError);

  const [filterType, setFilterType] = useState<'Semua' | 'Ruang' | 'Peralatan'>('Semua');
  const [filterItem, setFilterItem] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    id: '',
    nama_pemohon: '',
    item_tempahan: '',
    tarikh: initialToday,
    slot_masa: '',
    status: 'Menunggu',
  });

  const [deleteTarget, setDeleteTarget] = useState<BookingDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const pushToast = useCallback((text: string, type: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshBookings = useCallback(
    async (showSuccessToast = false) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        const data = (await res.json()) as {
          bookings?: BookingDTO[];
          today?: string;
          error?: string;
        };

        if (!res.ok) {
          const message = data.error || 'Gagal memuatkan senarai tempahan.';
          setDbError(message);
          pushToast(message, 'error');
          return;
        }

        setDbError(null);
        setBookings(data.bookings ?? []);
        if (data.today) {
          setToday(data.today);
        }
        if (showSuccessToast) {
          pushToast('Senarai tempahan berjaya dikemaskini.', 'success');
        }
      } catch {
        const message = 'Ralat rangkaian semasa memuatkan data.';
        setDbError(message);
        pushToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [pushToast]
  );

  const availableFilterItems = useMemo(() => {
    if (filterType === 'Ruang') return [...ROOM_ITEMS];
    if (filterType === 'Peralatan') return [...EQUIPMENT_ITEMS];
    return [...ALL_ITEMS];
  }, [filterType]);

  const handleTypeChange = (nextType: 'Semua' | 'Ruang' | 'Peralatan') => {
    setFilterType(nextType);
    const nextList: readonly string[] =
      nextType === 'Ruang'
        ? ROOM_ITEMS
        : nextType === 'Peralatan'
          ? EQUIPMENT_ITEMS
          : ALL_ITEMS;
    if (filterItem !== 'Semua' && !nextList.includes(filterItem)) {
      setFilterItem('Semua');
    }
  };

  const resetFilters = () => {
    setFilterType('Semua');
    setFilterItem('Semua');
    setSearchQuery('');
  };

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filterType !== 'Semua' && b.jenis_item !== filterType) {
        return false;
      }
      if (filterItem !== 'Semua' && b.item_tempahan !== filterItem) {
        return false;
      }
      if (q) {
        const hay = `${b.id} ${b.nama_pemohon} ${b.item_tempahan}`.toLowerCase();
        if (!hay.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, filterType, filterItem, searchQuery]);

  const stats = useMemo(() => {
    const todayCount = bookings.filter((b) => b.tarikh === today).length;
    const pendingCount = bookings.filter((b) => b.status === 'Menunggu').length;
    const approvedCount = bookings.filter((b) => b.status === 'Diluluskan').length;
    return {
      todayCount,
      pendingCount,
      approvedCount,
      totalCount: bookings.length,
    };
  }, [bookings, today]);

  const openCreateModal = () => {
    setFormError(null);
    setFormState({
      id: '',
      nama_pemohon: '',
      item_tempahan: '',
      tarikh: today,
      slot_masa: '',
      status: 'Menunggu',
    });
    setIsFormOpen(true);
  };

  const openEditModal = (booking: BookingDTO) => {
    setFormError(null);
    setFormState({
      id: booking.id,
      nama_pemohon: booking.nama_pemohon,
      item_tempahan: booking.item_tempahan,
      tarikh: booking.tarikh,
      slot_masa: booking.slot_masa,
      status: booking.status,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formState.nama_pemohon.trim();
    if (trimmedName.length < 2) {
      setFormError('Sila masukkan nama pemohon (sekurang-kurangnya 2 aksara).');
      return;
    }
    if (!formState.item_tempahan) {
      setFormError('Sila pilih ruang atau peralatan.');
      return;
    }
    if (!formState.tarikh) {
      setFormError('Sila pilih tarikh tempahan.');
      return;
    }
    if (!formState.slot_masa) {
      setFormError('Sila pilih slot masa.');
      return;
    }

    const isEdit = Boolean(formState.id);
    setIsSubmitting(true);

    try {
      const url = isEdit
        ? `/api/bookings/${encodeURIComponent(formState.id)}`
        : '/api/bookings';
      const method = isEdit ? 'PATCH' : 'POST';

      const payload = isEdit
        ? {
            nama_pemohon: trimmedName,
            item_tempahan: formState.item_tempahan,
            tarikh: formState.tarikh,
            slot_masa: formState.slot_masa,
            status: formState.status,
          }
        : {
            nama_pemohon: trimmedName,
            item_tempahan: formState.item_tempahan,
            tarikh: formState.tarikh,
            slot_masa: formState.slot_masa,
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as {
        message?: string;
        error?: string;
        booking?: BookingDTO;
      };

      if (!res.ok) {
        setFormError(data.error || 'Gagal menyimpan rekod tempahan.');
        return;
      }

      setIsFormOpen(false);
      await refreshBookings(false);
      pushToast(data.message || 'Tempahan berjaya disimpan.', 'success');
    } catch {
      setFormError('Ralat rangkaian semasa menyimpan tempahan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatus = async (id: string, nextStatus: 'Diluluskan' | 'Ditolak') => {
    setBusyRowId(id);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await res.json()) as {
        message?: string;
        error?: string;
        booking?: BookingDTO;
      };

      if (!res.ok) {
        pushToast(data.error || 'Gagal mengemaskini status.', 'error');
        return;
      }

      if (data.booking) {
        setBookings((prev) =>
          prev.map((item) => (item.id === id ? data.booking! : item))
        );
      } else {
        await refreshBookings(false);
      }
      pushToast(
        `Status tempahan ${id} ditukar kepada ${nextStatus}.`,
        'success'
      );
    } catch {
      pushToast('Ralat rangkaian semasa menukar status.', 'error');
    } finally {
      setBusyRowId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        pushToast(data.error || 'Gagal memadam rekod.', 'error');
        return;
      }

      setBookings((prev) => prev.filter((item) => item.id !== id));
      setDeleteTarget(null);
      pushToast(data.message || 'Tempahan berjaya dipadam.', 'success');
    } catch {
      pushToast('Ralat rangkaian semasa memadam rekod.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasActiveFilter =
    filterType !== 'Semua' || filterItem !== 'Semua' || searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          <a
            href="#ringkasan"
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 sm:text-lg"
          >
            Sistem Tempahan Ruang &amp; Peralatan
          </a>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <a
              href="#ringkasan"
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Ringkasan
            </a>
            <a
              href="#senarai"
              onClick={() => handleTypeChange('Semua')}
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Semua Rekod
            </a>
            <a
              href="#senarai"
              onClick={() => handleTypeChange('Ruang')}
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Ruang
            </a>
            <a
              href="#senarai"
              onClick={() => handleTypeChange('Peralatan')}
              className="hover:text-slate-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Peralatan
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Tempahan Baru</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {dbError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <p className="font-semibold">Sambungan Pangkalan Data Diperlukan</p>
                <p className="mt-0.5 text-amber-800">{dbError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => refreshBookings(true)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 whitespace-nowrap shrink-0"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cuba Semula</span>
            </button>
          </div>
        )}

        <section
          id="ringkasan"
          aria-label="Ringkasan Tempahan"
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tempahan Hari Ini
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.todayCount}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
              Tarikh · {formatDisplayDate(today)}
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Permohonan Menunggu
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-700 tabular-nums">
              {stats.pendingCount}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">
              Perlu semakan &amp; tindakan admin
            </p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Jumlah Rekod Tempahan
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
              {stats.totalCount}
            </p>
            <p className="mt-1.5 text-xs text-slate-500 tabular-nums">
              Diluluskan · {stats.approvedCount} rekod
            </p>
          </article>
        </section>

        <section
          id="senarai"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Senarai Tempahan Kampus
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                  Menunjukkan {filteredBookings.length} daripada {bookings.length} rekod tempahan
                </p>
              </div>
              <button
                type="button"
                onClick={() => refreshBookings(true)}
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                <span>Muat Semula</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[180px_220px_1fr_auto] lg:items-end">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filterType"
                  className="text-xs font-semibold text-slate-600"
                >
                  Jenis Item
                </label>
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as 'Semua' | 'Ruang' | 'Peralatan')
                  }
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                >
                  <option value="Semua">Semua Jenis</option>
                  <option value="Ruang">Ruang</option>
                  <option value="Peralatan">Peralatan</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="filterItem"
                  className="text-xs font-semibold text-slate-600"
                >
                  Item Spesifik
                </label>
                <select
                  id="filterItem"
                  value={filterItem}
                  onChange={(e) => setFilterItem(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                >
                  <option value="Semua">Semua Item</option>
                  {availableFilterItems.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="searchInput"
                  className="text-xs font-semibold text-slate-600"
                >
                  Carian Pemohon atau ID
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="searchInput"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama atau ID..."
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilter}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                Set Semula
              </button>
            </div>
          </div>

          {isLoading && bookings.length === 0 ? (
            <div className="divide-y divide-slate-200 p-4" aria-busy="true">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                  <div className="h-7 w-24 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <p className="text-base font-semibold text-slate-900">
                Tiada rekod tempahan ditemui
              </p>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {hasActiveFilter
                  ? 'Tiada rekod sepadan dengan penapis semasa. Cuba set semula penapis.'
                  : 'Belum ada rekod tempahan didaftarkan. Klik butang di bawah untuk menambah tempahan pertama.'}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Set Semula Penapis
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>Tambah Tempahan</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="px-4 py-3 whitespace-nowrap">ID</th>
                      <th className="px-4 py-3 whitespace-nowrap">Nama Pemohon</th>
                      <th className="px-4 py-3 whitespace-nowrap">Item Tempahan</th>
                      <th className="px-4 py-3 whitespace-nowrap">Tarikh</th>
                      <th className="px-4 py-3 whitespace-nowrap">Slot Masa</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredBookings.map((booking) => {
                      const rowBusy = busyRowId === booking.id;
                      const isApproved = booking.status === 'Diluluskan';
                      const isRejected = booking.status === 'Ditolak';

                      return (
                        <tr
                          key={booking.id}
                          className="transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                            {booking.id}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {booking.nama_pemohon}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-medium text-slate-900">
                              {booking.item_tempahan}
                            </div>
                            <div className="text-xs text-slate-500">
                              {booking.jenis_item}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700 tabular-nums whitespace-nowrap">
                            {formatDisplayDate(booking.tarikh)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                            {booking.slot_masa}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={booking.status} />
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={rowBusy || isApproved}
                                onClick={() => handleQuickStatus(booking.id, 'Diluluskan')}
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
                              >
                                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Lulus</span>
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy || isRejected}
                                onClick={() => handleQuickStatus(booking.id, 'Ditolak')}
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-45 whitespace-nowrap"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Tolak</span>
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => openEditModal(booking)}
                                title="Edit tempahan"
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-45 whitespace-nowrap"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                disabled={rowBusy}
                                onClick={() => setDeleteTarget(booking)}
                                title="Padam tempahan"
                                className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-45 whitespace-nowrap"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Padam</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="divide-y divide-slate-200 md:hidden">
                {filteredBookings.map((booking) => {
                  const rowBusy = busyRowId === booking.id;
                  const isApproved = booking.status === 'Diluluskan';
                  const isRejected = booking.status === 'Ditolak';

                  return (
                    <article key={booking.id} className="flex flex-col gap-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {booking.nama_pemohon}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {booking.jenis_item} &middot;{' '}
                            <span className="font-mono">{booking.id}</span>
                          </p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div>
                          <span className="block text-slate-400">Item</span>
                          <span className="font-medium text-slate-900">
                            {booking.item_tempahan}
                          </span>
                        </div>
                        <div>
                          <span className="block text-slate-400">Tarikh &amp; Slot</span>
                          <span className="font-medium text-slate-900 tabular-nums">
                            {formatDisplayDate(booking.tarikh)} &middot;{' '}
                            <span className="font-mono">{booking.slot_masa}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-1">
                        <button
                          type="button"
                          disabled={rowBusy || isApproved}
                          onClick={() => handleQuickStatus(booking.id, 'Diluluskan')}
                          className="inline-flex h-11 items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 disabled:opacity-45"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Lulus</span>
                        </button>
                        <button
                          type="button"
                          disabled={rowBusy || isRejected}
                          onClick={() => handleQuickStatus(booking.id, 'Ditolak')}
                          className="inline-flex h-11 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 disabled:opacity-45"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => openEditModal(booking)}
                          className="inline-flex h-11 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          disabled={rowBusy}
                          onClick={() => setDeleteTarget(booking)}
                          className="inline-flex h-11 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Padam</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Add / Edit Modal */}
      {isFormOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bookingModalTitle"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsFormOpen(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 id="bookingModalTitle" className="text-base font-bold text-slate-900">
                {formState.id
                  ? `Kemaskini Tempahan (${formState.id})`
                  : 'Tambah Tempahan Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={isSubmitting}
                aria-label="Tutup"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4 p-5" noValidate>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="nama_pemohon"
                  className="text-xs font-semibold text-slate-700"
                >
                  Nama Pemohon <span className="text-red-600">*</span>
                </label>
                <input
                  id="nama_pemohon"
                  type="text"
                  value={formState.nama_pemohon}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, nama_pemohon: e.target.value }))
                  }
                  placeholder="Contoh: Ahmad Faiz bin Roslan"
                  maxLength={120}
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="item_tempahan"
                  className="text-xs font-semibold text-slate-700"
                >
                  Item Tempahan <span className="text-red-600">*</span>
                </label>
                <select
                  id="item_tempahan"
                  value={formState.item_tempahan}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, item_tempahan: e.target.value }))
                  }
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                >
                  <option value="">-- Pilih Ruang atau Peralatan --</option>
                  <optgroup label="Ruang">
                    {ROOM_ITEMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Peralatan">
                    {EQUIPMENT_ITEMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="tarikh"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Tarikh <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="tarikh"
                    type="date"
                    value={formState.tarikh}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, tarikh: e.target.value }))
                    }
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="slot_masa"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Slot Masa <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="slot_masa"
                    value={formState.slot_masa}
                    onChange={(e) =>
                      setFormState((s) => ({ ...s, slot_masa: e.target.value }))
                    }
                    required
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  >
                    <option value="">-- Pilih Slot Masa --</option>
                    {VALID_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formState.id && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="status"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={formState.status}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        status: e.target.value as BookingStatus,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/15"
                  >
                    {VALID_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
                >
                  {formError}
                </div>
              )}

              <div className="mt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {isSubmitting
                    ? 'Menyimpan...'
                    : formState.id
                      ? 'Simpan Perubahan'
                      : 'Simpan Tempahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="deleteModalTitle"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 id="deleteModalTitle" className="text-base font-bold text-slate-900">
                Sahkan Pemadaman
              </h2>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                aria-label="Tutup"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-4 p-5">
              <p className="text-sm text-slate-600">
                Adakah anda pasti mahu memadam rekod tempahan berikut? Tindakan ini tidak
                boleh dibatalkan.
              </p>

              <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700">
                <div>
                  <span className="font-semibold">ID:</span>{' '}
                  <span className="font-mono">{deleteTarget.id}</span>
                </div>
                <div>
                  <span className="font-semibold">Pemohon:</span>{' '}
                  {deleteTarget.nama_pemohon}
                </div>
                <div>
                  <span className="font-semibold">Item:</span>{' '}
                  {deleteTarget.item_tempahan}
                </div>
                <div>
                  <span className="font-semibold">Tarikh &amp; Slot:</span>{' '}
                  {formatDisplayDate(deleteTarget.tarikh)} ({deleteTarget.slot_masa})
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="h-10 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50 whitespace-nowrap"
                >
                  {isDeleting ? 'Memadam...' : 'Ya, Padam Rekod'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div
        aria-live="polite"
        className="fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2 sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="shrink-0 rounded p-0.5 hover:bg-black/5"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
