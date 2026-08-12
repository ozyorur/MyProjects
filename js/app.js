(() => {
  'use strict';

  const STORAGE_KEY = 'fisDefteri.receipts.v1';
  const CATEGORIES = ['Yakıt', 'Market', 'Yemek', 'Ofis Malzemesi', 'Kırtasiye', 'Diğer'];
  const PAYMENT_METHODS = ['Nakit', 'Kredi Kartı', 'Banka Kartı', 'Havale/EFT', 'Diğer'];

  const currencyFmt = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
  const dateFmt = new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  /* ---------- state ---------- */
  let receipts = loadReceipts();
  let currentFilter = 'all';
  let editingId = null;

  /* ---------- elements ---------- */
  const el = {
    sumTotal: document.getElementById('sumTotal'),
    sumVat: document.getElementById('sumVat'),
    sumPending: document.getElementById('sumPending'),
    sumCount: document.getElementById('sumCount'),
    receiptList: document.getElementById('receiptList'),
    emptyState: document.getElementById('emptyState'),
    filters: document.getElementById('filters'),
    cameraInput: document.getElementById('cameraInput'),
    galleryInput: document.getElementById('galleryInput'),
    manualAddBtn: document.getElementById('manualAddBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importInput: document.getElementById('importInput'),
    modalOverlay: document.getElementById('modalOverlay'),
    modalTitle: document.getElementById('modalTitle'),
    modalNotice: document.getElementById('modalNotice'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    receiptForm: document.getElementById('receiptForm'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    toast: document.getElementById('toast'),
    fId: document.getElementById('fId'),
    fSatici: document.getElementById('fSatici'),
    fVergiNo: document.getElementById('fVergiNo'),
    fTarih: document.getElementById('fTarih'),
    fTutar: document.getElementById('fTutar'),
    fKdv1: document.getElementById('fKdv1'),
    fKdv10: document.getElementById('fKdv10'),
    fKdv20: document.getElementById('fKdv20'),
    fKategori: document.getElementById('fKategori'),
    fMusteri: document.getElementById('fMusteri'),
    fOdemeYontemi: document.getElementById('fOdemeYontemi'),
    fIslendi: document.getElementById('fIslendi'),
  };

  /* ---------- storage ---------- */
  function loadReceipts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Depo okunamadı:', e);
      return [];
    }
  }

  function saveReceipts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'r_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
  }

  /* ---------- helpers ---------- */
  function normalize(str) {
    return (str || '').trim().toLowerCase();
  }

  function toNumberOrNull(v) {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function fmtMoney(n) {
    return currencyFmt.format(n || 0);
  }

  function fmtDate(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (Number.isNaN(d.getTime())) return isoDate;
    return dateFmt.format(d);
  }

  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function showToast(message, type = 'info', duration = 3200) {
    el.toast.textContent = message;
    el.toast.classList.toggle('error', type === 'error');
    el.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.toast.hidden = true;
    }, duration);
  }

  /* ---------- rendering ---------- */
  function computeSummary() {
    const total = receipts.reduce((s, r) => s + (r.tutar || 0), 0);
    const vat = receipts.reduce((s, r) => s + (r.kdv1 || 0) + (r.kdv10 || 0) + (r.kdv20 || 0), 0);
    const pending = receipts.filter((r) => !r.islendi).reduce((s, r) => s + (r.tutar || 0), 0);
    return { total, vat, pending, count: receipts.length };
  }

  function filteredReceipts() {
    let list = receipts.slice().sort((a, b) => (b.tarih || '').localeCompare(a.tarih || '') || b.createdAt - a.createdAt);
    if (currentFilter === 'pending') list = list.filter((r) => !r.islendi);
    if (currentFilter === 'done') list = list.filter((r) => r.islendi);
    return list;
  }

  function render() {
    const s = computeSummary();
    el.sumTotal.textContent = fmtMoney(s.total);
    el.sumVat.textContent = fmtMoney(s.vat);
    el.sumPending.textContent = fmtMoney(s.pending);
    el.sumCount.textContent = String(s.count);

    const list = filteredReceipts();
    el.receiptList.innerHTML = '';
    el.emptyState.hidden = receipts.length !== 0;

    if (list.length === 0 && receipts.length > 0) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Bu filtreye uyan fiş yok.';
      el.receiptList.appendChild(p);
      return;
    }

    for (const r of list) {
      el.receiptList.appendChild(renderCard(r));
    }
  }

  function renderCard(r) {
    const card = document.createElement('article');
    card.className = 'receipt-card' + (r.islendi ? ' done' : '');

    const vatParts = [];
    if (r.kdv1) vatParts.push(`%1: ${fmtMoney(r.kdv1)}`);
    if (r.kdv10) vatParts.push(`%10: ${fmtMoney(r.kdv10)}`);
    if (r.kdv20) vatParts.push(`%20: ${fmtMoney(r.kdv20)}`);
    const vatLine = vatParts.length ? `KDV — ${vatParts.join(' · ')}` : 'KDV bilgisi yok';

    card.innerHTML = `
      <div class="receipt-card-top">
        <div>
          <div class="receipt-vendor">${escapeHtml(r.satici || 'İsimsiz Satıcı')}</div>
          ${r.vergiNo ? `<div class="receipt-vergino">VKN: ${escapeHtml(r.vergiNo)}</div>` : ''}
        </div>
        <span class="receipt-category">${escapeHtml(r.kategori || 'Diğer')}</span>
      </div>
      <div class="receipt-meta-row">
        <span>${fmtDate(r.tarih)}</span>
        <span>${escapeHtml(r.odemeYontemi || 'Nakit')}</span>
      </div>
      <div class="receipt-amount">${fmtMoney(r.tutar)}</div>
      <div class="receipt-vat-line">${vatLine}</div>
      <div class="receipt-bottom-row">
        <div class="receipt-tags">
          ${r.musteri ? `<span class="receipt-tag">👤 ${escapeHtml(r.musteri)}</span>` : ''}
        </div>
        <div class="receipt-actions">
          <button type="button" class="edit-link" data-action="edit">Düzenle</button>
          <label class="status-toggle ${r.islendi ? 'checked' : ''}">
            <input type="checkbox" data-action="toggle" ${r.islendi ? 'checked' : ''}>
            <span>İletildi</span>
          </label>
        </div>
      </div>
    `;

    card.querySelector('[data-action="edit"]').addEventListener('click', () => openModal(r));
    card.querySelector('[data-action="toggle"]').addEventListener('change', (e) => {
      toggleIslendi(r.id, e.target.checked);
    });

    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function toggleIslendi(id, value) {
    const r = receipts.find((x) => x.id === id);
    if (!r) return;
    r.islendi = value;
    r.updatedAt = Date.now();
    saveReceipts();
    render();
  }

  /* ---------- modal ---------- */
  function openModal(receipt, prefill) {
    editingId = receipt ? receipt.id : null;
    el.modalNotice.hidden = true;
    el.modalTitle.textContent = receipt ? 'Fişi Düzenle' : 'Yeni Fiş';
    el.deleteBtn.hidden = !receipt;

    const data = receipt || prefill || {};
    el.fId.value = receipt ? receipt.id : '';
    el.fSatici.value = data.satici || '';
    el.fVergiNo.value = data.vergiNo || '';
    el.fTarih.value = data.tarih || todayISO();
    el.fTutar.value = data.tutar ?? '';
    el.fKdv1.value = data.kdv1 ?? '';
    el.fKdv10.value = data.kdv10 ?? '';
    el.fKdv20.value = data.kdv20 ?? '';
    el.fKategori.value = CATEGORIES.includes(data.kategori) ? data.kategori : 'Diğer';
    el.fMusteri.value = data.musteri || '';
    el.fOdemeYontemi.value = PAYMENT_METHODS.includes(data.odemeYontemi) ? data.odemeYontemi : 'Nakit';
    el.fIslendi.checked = !!data.islendi;

    el.modalOverlay.hidden = false;
    setTimeout(() => el.fSatici.focus(), 50);
  }

  function openModalWithError(message) {
    editingId = null;
    el.modalTitle.textContent = 'Yeni Fiş (Elle)';
    el.deleteBtn.hidden = true;
    el.fId.value = '';
    el.fSatici.value = '';
    el.fVergiNo.value = '';
    el.fTarih.value = todayISO();
    el.fTutar.value = '';
    el.fKdv1.value = '';
    el.fKdv10.value = '';
    el.fKdv20.value = '';
    el.fKategori.value = 'Diğer';
    el.fMusteri.value = '';
    el.fOdemeYontemi.value = 'Nakit';
    el.fIslendi.checked = false;

    el.modalNotice.textContent = message;
    el.modalNotice.hidden = false;
    el.modalOverlay.hidden = false;
  }

  function closeModal() {
    el.modalOverlay.hidden = true;
    editingId = null;
    el.receiptForm.reset();
  }

  el.modalCloseBtn.addEventListener('click', closeModal);
  el.cancelBtn.addEventListener('click', closeModal);
  el.modalOverlay.addEventListener('click', (e) => {
    if (e.target === el.modalOverlay) closeModal();
  });

  el.receiptForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!el.fSatici.value.trim()) {
      showToast('Satıcı alanı zorunlu.', 'error');
      return;
    }
    if (!el.fTarih.value) {
      showToast('Tarih alanı zorunlu.', 'error');
      return;
    }
    const tutar = toNumberOrNull(el.fTutar.value);
    if (tutar === null) {
      showToast('Geçerli bir tutar girin.', 'error');
      return;
    }

    const now = Date.now();
    const payload = {
      satici: el.fSatici.value.trim(),
      vergiNo: el.fVergiNo.value.trim() || null,
      tarih: el.fTarih.value,
      tutar,
      kdv1: toNumberOrNull(el.fKdv1.value),
      kdv10: toNumberOrNull(el.fKdv10.value),
      kdv20: toNumberOrNull(el.fKdv20.value),
      kategori: el.fKategori.value,
      musteri: el.fMusteri.value.trim(),
      odemeYontemi: el.fOdemeYontemi.value,
      islendi: el.fIslendi.checked,
      updatedAt: now,
    };

    if (editingId) {
      const idx = receipts.findIndex((r) => r.id === editingId);
      if (idx !== -1) {
        receipts[idx] = { ...receipts[idx], ...payload };
      }
    } else {
      receipts.push({ id: uid(), createdAt: now, ...payload });
    }

    saveReceipts();
    render();
    closeModal();
    showToast('Fiş kaydedildi.');
  });

  el.deleteBtn.addEventListener('click', () => {
    if (!editingId) return;
    if (!confirm('Bu fişi silmek istediğinize emin misiniz?')) return;
    receipts = receipts.filter((r) => r.id !== editingId);
    saveReceipts();
    render();
    closeModal();
    showToast('Fiş silindi.');
  });

  el.manualAddBtn.addEventListener('click', () => openModal(null));

  /* ---------- filters ---------- */
  el.filters.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    currentFilter = btn.dataset.filter;
    el.filters.querySelectorAll('.filter-btn').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });

  /* ---------- OCR ---------- */
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        const base64 = String(result).split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleFileSelect(file) {
    if (!file) return;
    el.loadingOverlay.hidden = false;
    try {
      const base64 = await fileToBase64(file);
      const resp = await fetch('/.netlify/functions/oku-fis', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType: file.type || 'image/jpeg' }),
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data || !data.result) {
        const msg = (data && data.error) || 'Fiş okunamadı.';
        throw new Error(msg);
      }

      const r = data.result;
      openModal(null, {
        satici: r.satici || '',
        vergiNo: r.vergiNo || '',
        tarih: r.tarih || todayISO(),
        tutar: r.tutar ?? '',
        kdv1: r.kdv1 ?? '',
        kdv10: r.kdv10 ?? '',
        kdv20: r.kdv20 ?? '',
        kategori: CATEGORIES.includes(r.kategori) ? r.kategori : 'Diğer',
        musteri: '',
        odemeYontemi: 'Nakit',
        islendi: false,
      });
    } catch (err) {
      console.error(err);
      openModalWithError('OCR başarısız oldu: ' + err.message + ' — bilgileri elle girebilirsiniz.');
    } finally {
      el.loadingOverlay.hidden = true;
    }
  }

  el.cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    e.target.value = '';
  });

  el.galleryInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
    e.target.value = '';
  });

  /* ---------- export ---------- */
  el.exportBtn.addEventListener('click', () => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      receipts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    a.href = url;
    a.download = `fis-defteri-yedek-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Yedek indirildi.');
  });

  /* ---------- import ---------- */
  function matchKey(r) {
    return [normalize(r.satici), r.tarih || '', normalize(r.musteri), r.odemeYontemi || ''].join('||');
  }

  el.importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    let parsed;
    try {
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch (err) {
      showToast('Dosya okunamadı: geçersiz JSON.', 'error');
      return;
    }

    const incoming = Array.isArray(parsed) ? parsed : parsed.receipts;
    if (!Array.isArray(incoming)) {
      showToast('Geçersiz yedek dosyası formatı.', 'error');
      return;
    }

    let updated = 0;
    let added = 0;
    const now = Date.now();

    const existingByKey = new Map();
    receipts.forEach((r) => existingByKey.set(matchKey(r), r));

    for (const raw of incoming) {
      if (!raw || typeof raw !== 'object') continue;

      const normalized = {
        satici: String(raw.satici || '').trim(),
        vergiNo: raw.vergiNo || null,
        musteri: String(raw.musteri || '').trim(),
        odemeYontemi: PAYMENT_METHODS.includes(raw.odemeYontemi) ? raw.odemeYontemi : 'Nakit',
        tarih: raw.tarih || '',
        tutar: toNumberOrNull(raw.tutar) ?? 0,
        kdv1: toNumberOrNull(raw.kdv1),
        kdv10: toNumberOrNull(raw.kdv10),
        kdv20: toNumberOrNull(raw.kdv20),
        kategori: CATEGORIES.includes(raw.kategori) ? raw.kategori : 'Diğer',
        islendi: !!raw.islendi,
      };

      if (!normalized.satici || !normalized.tarih) continue;

      const key = matchKey(normalized);
      const existing = existingByKey.get(key);

      if (existing) {
        Object.assign(existing, normalized, { updatedAt: now });
        updated++;
      } else {
        const newRecord = {
          id: uid(),
          createdAt: raw.createdAt || now,
          updatedAt: now,
          ...normalized,
        };
        receipts.push(newRecord);
        existingByKey.set(key, newRecord);
        added++;
      }
    }

    saveReceipts();
    render();
    showToast(`${updated} kayıt güncellendi, ${added} kayıt yeni eklendi.`);
  });

  /* ---------- init ---------- */
  render();
})();
