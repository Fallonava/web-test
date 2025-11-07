// Config
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyVnM9JhKx8xj2EZhETj1BdSCnmJxtNBV4eFmohKE0denRS4VEA3JqPI-RVsQFg7ZuEtw/exec';
const REFRESH_INTERVAL = 10000; // 10s
const CACHE_DURATION = 10000; // 10s
const FETCH_TIMEOUT = 10000; // 10s

// State
let allData = [];
let dataInterval = null;
let currentFilter = 'all';

// DOM
const loadingIndicator = document.getElementById('loadingIndicator');
const liveRegion = document.getElementById('liveRegion');
const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));

// Utilities
function setRootScaleAuto() {
  // Auto detect preferred scaling for TV or desktop
  const width = Math.max(window.screen.width, window.innerWidth);
  const height = Math.max(window.screen.height, window.innerHeight);
  // Example heuristic: treat >= 3840 as 4K, >=1920 as 1080p TV
  let base = 14; // px
  if (width >= 3840 || height >= 2160) base = 16;
  else if (width >= 1920 || height >= 1080) base = 15;
  else base = 14;
  document.documentElement.style.fontSize = base + 'px';
}

function showLoading() { loadingIndicator.style.display = 'block'; loadingIndicator.setAttribute('aria-hidden', 'false'); }
function hideLoading() { loadingIndicator.style.display = 'none'; loadingIndicator.setAttribute('aria-hidden', 'true'); }

function cacheData(data){ try{ localStorage.setItem('doctorSchedule', JSON.stringify({data, timestamp: Date.now()})); }catch(e){console.warn('cache failed',e);} }
function getCachedData(){ try{ const raw = localStorage.getItem('doctorSchedule'); if(!raw) return null; const {data,timestamp} = JSON.parse(raw); if(Date.now() - timestamp < CACHE_DURATION) return data; }catch(e){console.warn('read cache fail',e);} return null }

function validateData(data){ if(!Array.isArray(data)) return false; return data.every(item => item && typeof item === 'object' && 'Spesialis' in item && 'Dokter' in item && 'Status' in item && 'Jenis' in item); }

function buildRow(item){
  const statusClass = item.Status && item.Status.includes('BUKA') ? 'BUKA' : 'TIDAK';
  return `
    <tr>
      <td>${escapeHtml(item.Spesialis || '-')}</td>
      <td>${escapeHtml(item.Dokter || '-')}</td>
      <td><span class="status ${statusClass}" tabindex="0" aria-label="Status: ${statusClass === 'BUKA' ? 'Buka' : 'Tutup'}">${escapeHtml(item.Status || statusClass)}</span></td>
      <td>${escapeHtml(item.Jam || '-')}</td>
    </tr>
  `;
}

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); }

function showData(data){
  const bedahBody = document.getElementById('bedahBody');
  const nonBedahBody = document.getElementById('nonBedahBody');
  bedahBody.innerHTML = '';
  nonBedahBody.innerHTML = '';

  if(!data || data.length === 0){ showEmptyState(); return; }

  const bedahRows = [];
  const nonBedahRows = [];

  data.forEach(item => {
    const html = buildRow(item);
    if(String(item.Jenis || '').toLowerCase() === 'bedah') bedahRows.push(html);
    else nonBedahRows.push(html);
  });

  bedahBody.innerHTML = bedahRows.join('') || `<tr><td colspan="4" class="error-message">📝 Tidak ada data untuk Bedah.</td></tr>`;
  nonBedahBody.innerHTML = nonBedahRows.join('') || `<tr><td colspan="4" class="error-message">📝 Tidak ada data untuk Non Bedah.</td></tr>`;

  applyFilter(currentFilter);
  // animate sections in
  document.querySelectorAll('.section').forEach((s,i)=>{ s.classList.remove('show'); setTimeout(()=>s.classList.add('show'), 80 * i); });
}

function showErrorState(message='⚠️ Gagal memuat data jadwal dokter.'){
  const html = `<tr><td colspan="4" class="error-message">${message}<br><button id="reloadBtn">Coba Lagi</button></td></tr>`;
  document.querySelectorAll('tbody').forEach(tb=>{ tb.innerHTML = html; });
  document.getElementById('reloadBtn')?.addEventListener('click', loadData);
}

function showEmptyState(){ const html = `<tr><td colspan="4" class="error-message">📝 Tidak ada data jadwal dokter yang tersedia.</td></tr>`; document.querySelectorAll('tbody').forEach(tb=>tb.innerHTML = html); }

async function fetchWithTimeout(url, timeout = FETCH_TIMEOUT){
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  try{
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if(!res.ok) throw new Error('Network response not ok');
    return await res.json();
  }catch(err){ clearTimeout(id); throw err; }
}

async function loadData(){
  const cached = getCachedData();
  if(cached){ showData(cached); hideLoading(); }

  try{
    showLoading();
    const data = await fetchWithTimeout(SHEET_URL);
    if(!validateData(data)) throw new Error('Invalid data format');
    allData = data;
    cacheData(data);
    showData(data);
    liveRegion.textContent = 'Data jadwal dokter telah diperbarui';
  }catch(err){
    console.warn('loadData err', err);
    if(err.name === 'AbortError') showErrorState('Timeout: Server tidak merespons. Memuat data cache jika tersedia.');
    else showErrorState('Gagal memuat data jadwal. Memuat data cache jika tersedia.');
    const cached2 = getCachedData();
    if(cached2){ showData(cached2); liveRegion.textContent = 'Menampilkan data cache terakhir'; }
  }finally{ hideLoading(); }
}

function setActiveFilter(filter){
  filterButtons.forEach(btn=>{ const is = btn.dataset.filter === filter; btn.classList.toggle('active', is); btn.setAttribute('aria-pressed', is); });
  currentFilter = filter;
}

function applyFilter(filter){
  const rows = Array.from(document.querySelectorAll('tbody tr'));
  let visible = 0;
  rows.forEach(r=>{
    if(r.querySelector('.error-message')){ r.style.display = ''; return; }
    const statusEl = r.querySelector('.status');
    const status = statusEl && statusEl.classList.contains('BUKA') ? 'BUKA' : 'TIDAK';
    if(filter === 'all' || filter === status){ r.style.display = ''; visible++; } else r.style.display = 'none';
  });
  liveRegion.textContent = `Menampilkan ${visible} dokter ${filter==='all'?'':'('+filter+')'}`;
}

function setupEventListeners(){
  filterButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{ setActiveFilter(btn.dataset.filter); applyFilter(btn.dataset.filter); });
    btn.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
  });

  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden) clearInterval(dataInterval);
    else { clearInterval(dataInterval); startDataInterval(); loadData(); }
  });

  window.addEventListener('online', ()=>{ loadData(); liveRegion.textContent = 'Koneksi internet tersedia. Memperbarui data...'; });
  window.addEventListener('offline', ()=>{ liveRegion.textContent = 'Koneksi internet terputus. Menampilkan data cache.'; });
}

function startDataInterval(){ clearInterval(dataInterval); dataInterval = setInterval(loadData, REFRESH_INTERVAL); }

// Date/time
function updateDateTime(){
  const now = new Date();
  document.getElementById('tanggal').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const jamEl = document.getElementById('jam');
  jamEl.style.opacity = '0.4';
  setTimeout(()=>{ jamEl.style.opacity = '1'; jamEl.textContent = now.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit',second:'2-digit'}); }, 200);
}

// Simple lightweight particles (non-blocking)
function initializeParticles(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const container = document.getElementById('particles');
  const count = Math.min(16, Math.round(window.innerWidth / 160));
  for(let i=0;i<count;i++){
    const d = document.createElement('div'); d.className='particle';
    const size = Math.random()*10+4; d.style.width = d.style.height = size+'px';
    d.style.left = Math.random()*100+'%'; d.style.top = 80+Math.random()*20+'%';
    d.style.background = `rgba(79,195,247,${0.06+Math.random()*0.12})`;
    d.style.transform = `translateY(${-(40+Math.random()*60)}vh)`;
    d.style.transition = `transform ${8+Math.random()*10}s ease-in-out ${Math.random()*5}s`;
    container.appendChild(d);
    // trigger movement
    requestAnimationFrame(()=>{ d.style.transform = `translateY(-120vh) scale(${1+Math.random()*0.6})`; d.style.opacity = '0'; });
  }
}

// Init
document.addEventListener('DOMContentLoaded', ()=>{
  setRootScaleAuto();
  initializeParticles();
  updateDateTime();
  showEmptyState();
  setupEventListeners();
  loadData();
  startDataInterval();
  setInterval(updateDateTime, 1000);
});
