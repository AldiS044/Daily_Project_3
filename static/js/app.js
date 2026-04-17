// ── STATE ──────────────────────────────────────────────────────────────────
let allAlumni = [];
let currentDetailId = null;
let currentEvidenceAlumniId = null;
const API = '';

document.addEventListener('DOMContentLoaded', async () => { await loadDashboard(); });

// ── NAVIGATION ─────────────────────────────────────────────────────────────
function navigateTo(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  if (el) el.classList.add('active');
  if (page === 'alumni') renderAlumniPage();
  if (page === 'monitoring') renderMonitoringPage();
  if (page === 'evidence') renderEvidencePage();
}

// ── DASHBOARD ──────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [statsRes, alumniRes] = await Promise.all([fetch(`${API}/api/stats`), fetch(`${API}/api/alumni`)]);
    const stats = await statsRes.json();
    allAlumni = await alumniRes.json();
    document.getElementById('sv-total').textContent  = stats.total;
    document.getElementById('sv-prof').textContent   = stats.statuses['Aktif Profesional'] || 0;
    document.getElementById('sv-akad').textContent   = stats.statuses['Aktif Akademik'] || 0;
    document.getElementById('sv-events').textContent = stats.events_total;
    renderDonutChart(stats.statuses, stats.total);
    renderBarChart(stats.program_studi);
    renderRecentTable(allAlumni.slice(-8).reverse());
  } catch(e) { console.error(e); }
}

function renderDonutChart(statuses, total) {
  const colors = {'Aktif Profesional':'#22d47a','Aktif Akademik':'#b06eff','Tidak Teridentifikasi':'#556070','Perlu Verifikasi':'#f0b429'};
  const R=52, stroke=14, cx=65, cy=65, circ=2*Math.PI*R;
  let segs='', offset=0;
  Object.entries(statuses).forEach(([s,c]) => {
    const dash=(c/total)*circ, gap=circ-dash, rot=(offset/circ)*360-90;
    segs += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${colors[s]||'#334155'}" stroke-width="${stroke}" stroke-dasharray="${dash} ${gap}" transform="rotate(${rot} ${cx} ${cy})"/>`;
    offset += dash;
  });
  document.getElementById('statusChart').innerHTML = `
    <svg class="donut-svg" viewBox="0 0 130 130">
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#1c2030" stroke-width="${stroke}"/>
      ${segs||`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#252a38" stroke-width="${stroke}"/>`}
    </svg>
    <div class="donut-label"><span class="donut-label-num">${total}</span><span class="donut-label-sub">Total</span></div>`;
  document.getElementById('statusLegend').innerHTML = Object.entries(colors).map(([s,c]) =>
    `<div class="legend-item"><span class="legend-dot" style="background:${c}"></span><span>${s}</span><span class="legend-count">${statuses[s]||0}</span></div>`
  ).join('');
}

function renderBarChart(prodiData) {
  const max = Math.max(...Object.values(prodiData),1);
  const c = document.getElementById('prodiChart');
  if (!Object.keys(prodiData).length) { c.innerHTML='<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:20px">Belum ada data</p>'; return; }
  c.innerHTML = Object.entries(prodiData).sort((a,b)=>b[1]-a[1]).map(([p,n]) =>
    `<div class="bar-row"><span class="bar-label" title="${p}">${p}</span><div class="bar-track"><div class="bar-fill" style="width:${(n/max)*100}%"></div></div><span class="bar-count">${n}</span></div>`
  ).join('');
}

function renderRecentTable(alumni) {
  const tb = document.getElementById('recentTableBody');
  if (!alumni.length) { tb.innerHTML='<tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:20px">Belum ada data</td></tr>'; return; }
  tb.innerHTML = alumni.map(a => `<tr>
    <td style="color:var(--text-primary);font-weight:600">${a.nama}</td>
    <td>${a.program_studi}</td><td>${a.bidang_keahlian||'–'}</td>
    <td>${a.kota_asal||'–'}</td><td>${a.tahun_lulus}</td>
    <td>${statusBadge(a.status)}</td></tr>`).join('');
}

// ── ALUMNI TABLE ────────────────────────────────────────────────────────────
async function renderAlumniPage() {
  const res = await fetch(`${API}/api/alumni`);
  allAlumni = await res.json();
  populateProdiFilter();
  displayAlumniTable(allAlumni);
}

function populateProdiFilter() {
  const sel = document.getElementById('filterProdi');
  const prodis = [...new Set(allAlumni.map(a=>a.program_studi).filter(Boolean))];
  sel.innerHTML = '<option value="">Semua Prodi</option>' + prodis.map(p=>`<option>${p}</option>`).join('');
}

function displayAlumniTable(list) {
  const tb = document.getElementById('alumniTableBody');
  const empty = document.getElementById('alumniEmpty');
  const wrap = document.querySelector('.alumni-table-wrap');
  const count = document.getElementById('alumniCount');
  count.textContent = list.length + ' alumni';
  if (!list.length) {
    wrap.style.display='none'; empty.classList.remove('hidden'); return;
  }
  wrap.style.display=''; empty.classList.add('hidden');
  tb.innerHTML = list.map(a => {
    const initials = a.nama.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const ev = (a.events||[]).length;
    const mon = a.last_monitored ? new Date(a.last_monitored).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '–';
    return `<tr onclick="openDetail('${a.id}')">
      <td><div class="tname"><div class="mini-avatar">${initials}</div>${a.nama}</div></td>
      <td>${a.program_studi}</td><td>${a.bidang_keahlian||'–'}</td>
      <td>${a.kota_asal||'–'}</td><td>${a.tahun_lulus}</td>
      <td>${statusBadge(a.status)}</td>
      <td style="color:var(--text-primary);font-weight:600">${ev}</td>
      <td>${mon}</td>
      <td onclick="event.stopPropagation()"><div class="tactions">
        <button class="btn btn-xs btn-outline" onclick="runOneMonitoring('${a.id}')">Monitor</button>
        <button class="btn btn-xs btn-danger" onclick="deleteAlumni('${a.id}')">×</button>
      </div></td></tr>`;
  }).join('');
}

function filterAlumni() {
  const q = document.getElementById('alumniSearch').value.toLowerCase();
  const s = document.getElementById('filterStatus').value;
  const p = document.getElementById('filterProdi').value;
  displayAlumniTable(allAlumni.filter(a =>
    (!q || a.nama.toLowerCase().includes(q)||(a.bidang_keahlian||'').toLowerCase().includes(q)||(a.kota_asal||'').toLowerCase().includes(q)) &&
    (!s || a.status===s) && (!p || a.program_studi===p)
  ));
}

// ── MONITORING TABLE ────────────────────────────────────────────────────────
async function renderMonitoringPage() {
  const res = await fetch(`${API}/api/alumni`);
  allAlumni = await res.json();
  const tb = document.getElementById('monitorTableBody');
  const empty = document.getElementById('monitorEmpty');
  const wrap = document.querySelector('.monitor-table-wrap');
  if (!allAlumni.length) { wrap.style.display='none'; empty.classList.remove('hidden'); return; }
  wrap.style.display=''; empty.classList.add('hidden');
  tb.innerHTML = allAlumni.map(a => {
    const initials = a.nama.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    const ev = (a.events||[]).length;
    const mon = a.last_monitored ? new Date(a.last_monitored).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : 'Belum pernah';
    const next = a.next_monitor ? new Date(a.next_monitor).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '–';
    const prog = a.last_monitored ? calcMonitorProgress(a.last_monitored, a.next_monitor) : 0;
    const pc = prog>75?'#f05252':prog>40?'#f0b429':'#22d47a';
    return `<tr>
      <td><div class="tname"><div class="mini-avatar">${initials}</div>${a.nama}</div></td>
      <td>${a.program_studi}</td>
      <td>${statusBadge(a.status)}</td>
      <td style="color:var(--text-primary);font-weight:600">${ev}</td>
      <td>${mon}</td>
      <td>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${prog}%;background:${pc}"></div></div>
        <div class="cycle-info">${prog}% dari 90 hari</div>
      </td>
      <td>${next}</td>
      <td><button class="btn btn-xs btn-outline" id="mbtn-${a.id}" onclick="runOneMonitoring('${a.id}')">Run</button></td>
    </tr>`;
  }).join('');
}

function calcMonitorProgress(last, next) {
  if (!last||!next) return 0;
  return Math.min(Math.max(Math.round(((Date.now()-new Date(last))/(new Date(next)-new Date(last)))*100),0),100);
}

async function runAllMonitoring() {
  const btn = document.getElementById('monitorAllBtn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Memproses...';
  try {
    await fetch(`${API}/api/monitor/all`,{method:'POST'});
    showToast('✅ Semua alumni berhasil dimonitor!');
    await renderMonitoringPage(); loadDashboard();
  } catch(e) { showToast('❌ Terjadi kesalahan'); }
  finally {
    btn.disabled=false;
    btn.innerHTML='<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Jalankan Semua';
  }
}

async function runOneMonitoring(id) {
  const btn = document.getElementById('mbtn-'+id);
  if (btn) { btn.disabled=true; btn.textContent='...'; }
  try {
    const res = await fetch(`${API}/api/alumni/${id}/monitor`,{method:'POST'});
    const updated = await res.json();
    const idx = allAlumni.findIndex(a=>a.id===id);
    if (idx>=0) allAlumni[idx]=updated;
    showToast(`✅ ${updated.nama} — ${updated.status}`);
    if (document.getElementById('page-monitoring').classList.contains('active')) renderMonitoringPage();
    if (document.getElementById('page-alumni').classList.contains('active')) displayAlumniTable(allAlumni);
    if (document.getElementById('page-evidence').classList.contains('active')) renderEvidencePage();
    if (currentDetailId===id) openDetail(id);
    loadDashboard();
  } catch(e) { showToast('❌ Gagal monitoring'); }
  finally { if (btn) { btn.disabled=false; btn.textContent='Run'; } }
}

// ── EVIDENCE SPLIT VIEW ─────────────────────────────────────────────────────
async function renderEvidencePage() {
  const res = await fetch(`${API}/api/alumni`);
  allAlumni = await res.json();
  const list = document.getElementById('evidenceAlumniList');
  const withEv = allAlumni.filter(a=>(a.events||[]).length>0);
  if (!withEv.length) {
    list.innerHTML='<div style="padding:16px;font-size:12px;color:var(--text-muted);text-align:center">Jalankan monitoring dulu</div>'; return;
  }
  list.innerHTML = withEv.map(a => {
    const initials = a.nama.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
    return `<div class="ev-alumni-item ${currentEvidenceAlumniId===a.id?'active':''}" onclick="showEvidenceFor('${a.id}')">
      <div class="mini-avatar" style="width:24px;height:24px;font-size:9px">${initials}</div>
      <div>
        <div class="ev-alumni-name">${a.nama}</div>
        <div class="ev-alumni-meta">${(a.events||[]).length} events · ${a.status}</div>
      </div>
    </div>`;
  }).join('');
  if (currentEvidenceAlumniId) showEvidenceFor(currentEvidenceAlumniId);
  else if (withEv.length) showEvidenceFor(withEv[0].id);
}

function showEvidenceFor(id) {
  currentEvidenceAlumniId = id;
  const alumni = allAlumni.find(a=>a.id===id);
  if (!alumni) return;
  document.querySelectorAll('.ev-alumni-item').forEach(el => el.classList.toggle('active', el.onclick.toString().includes(id)));
  document.getElementById('ev-main-title').textContent = alumni.nama;
  document.getElementById('ev-main-status').innerHTML = statusBadge(alumni.status);
  const events = alumni.events || [];
  document.getElementById('ev-main-count').textContent = events.length + ' events';
  const wrap = document.getElementById('evidenceItemsWrap');
  if (!events.length) {
    wrap.innerHTML='<div class="empty-state"><div class="empty-icon">📋</div><h3>Belum ada evidence</h3><p>Jalankan monitoring untuk alumni ini.</p></div>'; return;
  }
  wrap.innerHTML = events.map(ev => {
    const conf=ev.confidence_score, cc=conf>=0.8?'#22d47a':conf>=0.6?'#f0b429':'#f05252';
    return `<div class="evidence-item">
      <div class="ev-icon">${ev.event_icon}</div>
      <div class="ev-content">
        <div class="ev-title">${ev.event_label} — ${ev.organization} · ${ev.position}</div>
        <div class="ev-meta">
          <span>📅 ${ev.date}</span><span>🔗 ${ev.source}</span>
          <span>${ev.validated?'✅ Valid':'⚠️ Perlu Verifikasi'}</span>
          <span>Ditemukan: ${ev.found_date}</span>
        </div>
      </div>
      <div class="ev-score"><span class="confidence-badge" style="background:${cc}20;color:${cc}">${Math.round(conf*100)}%</span></div>
    </div>`;
  }).join('');
}

// ── DETAIL MODAL ──────────────────────────────────────────────────────────────
async function openDetail(id) {
  currentDetailId = id;
  let alumni = allAlumni.find(a=>a.id===id);
  if (!alumni) { const r=await fetch(`${API}/api/alumni/${id}`); alumni=await r.json(); }

  document.getElementById('detail-nama').textContent = alumni.nama;
  document.getElementById('detail-status').className='badge '+statusClass(alumni.status);
  document.getElementById('detail-status').textContent = alumni.status;
  document.getElementById('d-prodi').textContent   = alumni.program_studi||'–';
  document.getElementById('d-tahun').textContent   = alumni.tahun_lulus||'–';
  document.getElementById('d-bidang').textContent  = alumni.bidang_keahlian||'–';
  document.getElementById('d-kota').textContent    = alumni.kota_asal||'–';
  document.getElementById('d-monitored').textContent = alumni.last_monitored?new Date(alumni.last_monitored).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'Belum pernah';
  document.getElementById('d-next').textContent    = alumni.next_monitor?new Date(alumni.next_monitor).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'}):'–';

  const p = alumni.profile||{};
  document.getElementById('d-profile-content').innerHTML = `
    <div class="profile-tags-row"><span class="profile-tags-label">Variasi Nama</span>${(p.name_variations||[]).map(n=>`<span class="tag">${n}</span>`).join('')}</div>
    <div class="profile-tags-row"><span class="profile-tags-label">Bidang</span>${(p.field_keywords||[]).map(k=>`<span class="tag">${k}</span>`).join('')}</div>
    <div class="profile-tags-row"><span class="profile-tags-label">Universitas</span>${(p.university_keywords||[]).map(k=>`<span class="tag">${k}</span>`).join('')}</div>
    <div class="profile-tags-row"><span class="profile-tags-label">Profesi</span>${(p.possible_professions||[]).map(pr=>`<span class="tag">${pr}</span>`).join('')}</div>`;

  const tl = alumni.timeline||[];
  document.getElementById('d-timeline').innerHTML = tl.length ? tl.map(t=>`
    <div class="timeline-item">
      <div class="timeline-dot" style="background:${t.color||'#4f8ef7'}">${t.icon}</div>
      <div class="timeline-date">${t.date}</div>
      <div class="timeline-title">${t.label}</div>
      <div class="timeline-desc">${t.description}</div>
    </div>`).join('') : '<p style="color:var(--text-muted);font-size:12px">Belum ada timeline. Jalankan monitoring.</p>';

  const evs = alumni.events||[];
  document.getElementById('d-events-list').innerHTML = evs.length ? evs.map(ev=>{
    const conf=ev.confidence_score, cc=conf>=0.8?'#22d47a':conf>=0.6?'#f0b429':'#f05252';
    return `<div class="event-item" style="border-color:${ev.event_color}">
      <div class="event-icon">${ev.event_icon}</div>
      <div class="event-body">
        <div class="event-title">${ev.event_label}
          <span class="confidence-badge" style="background:${cc}20;color:${cc}">${Math.round(conf*100)}%</span></div>
        <div class="event-meta"><span>📅 ${ev.date}</span><span>🔗 ${ev.source}</span><span>🏢 ${ev.organization}</span><span>👤 ${ev.position}</span><span>${ev.validated?'✅ Valid':'⚠️ Perlu Verifikasi'}</span></div>
      </div></div>`;}).join('') : '<p style="color:var(--text-muted);font-size:12px">Belum ada events. Jalankan monitoring.</p>';

  const qs = alumni.queries||[];
  document.getElementById('d-queries-list').innerHTML = qs.length ? qs.map((q,i)=>`<div class="query-item"><span class="query-num">${i+1}.</span>${q}</div>`).join('') : '<p style="color:var(--text-muted);font-size:12px">Belum ada query.</p>';

  document.getElementById('detail-monitor-btn').onclick = ()=>runOneMonitoring(id);
  document.getElementById('detail-delete-btn').onclick  = ()=>{ closeModal(); deleteAlumni(id); };

  document.querySelectorAll('.tab-btn').forEach((b,i)=>b.classList.toggle('active',i===0));
  document.querySelectorAll('.tab-content').forEach((t,i)=>{t.classList.toggle('active',i===0);t.classList.toggle('hidden',i!==0);});
  openModal('alumniDetail');
}

function switchTab(name, btn) {
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t=>{t.classList.remove('active');t.classList.add('hidden');});
  btn.classList.add('active');
  const tc=document.getElementById('tab-'+name);
  if(tc){tc.classList.remove('hidden');tc.classList.add('active');}
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function submitAddAlumni() {
  const data = { nama:document.getElementById('inp-nama').value.trim(), program_studi:document.getElementById('inp-prodi').value, tahun_lulus:document.getElementById('inp-tahun').value, bidang_keahlian:document.getElementById('inp-bidang').value.trim(), kota_asal:document.getElementById('inp-kota').value.trim() };
  if (!data.nama) { showToast('⚠️ Nama wajib diisi'); return; }
  try {
    const res=await fetch(`${API}/api/alumni`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const saved=await res.json(); allAlumni.push(saved); closeModal();
    showToast(`✅ "${saved.nama}" berhasil ditambahkan!`); loadDashboard();
    if(document.getElementById('page-alumni').classList.contains('active')) renderAlumniPage();
  } catch(e) { showToast('❌ Gagal menyimpan alumni'); }
}

async function deleteAlumni(id) {
  const a=allAlumni.find(x=>x.id===id);
  if(!a||!confirm(`Hapus alumni "${a.nama}"?`)) return;
  try {
    await fetch(`${API}/api/alumni/${id}`,{method:'DELETE'});
    allAlumni=allAlumni.filter(x=>x.id!==id);
    showToast(`🗑️ "${a.nama}" dihapus`); loadDashboard();
    if(document.getElementById('page-alumni').classList.contains('active')) displayAlumniTable(allAlumni);
    if(document.getElementById('page-monitoring').classList.contains('active')) renderMonitoringPage();
  } catch(e) { showToast('❌ Gagal menghapus'); }
}

async function seedData() {
  const btn=document.getElementById('seedBtn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Memuat...';
  try {
    await fetch(`${API}/api/seed`,{method:'POST'});
    showToast('✅ 8 data alumni contoh berhasil dimuat!'); await loadDashboard();
    if(document.getElementById('page-alumni').classList.contains('active')) renderAlumniPage();
  } catch(e) { showToast('❌ Gagal memuat data contoh'); }
  finally { btn.disabled=false; btn.innerHTML='<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg> Data Contoh'; }
}

// ── MODAL & HELPERS ───────────────────────────────────────────────────────────
function openModal(name) {
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
  const m=document.getElementById('modal-'+name); if(m) m.classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
  currentDetailId=null;
}
function statusBadge(s){ return `<span class="badge ${statusClass(s)}">${s||'Perlu Verifikasi'}</span>`; }
function statusClass(s){ return {'Aktif Profesional':'badge-prof','Aktif Akademik':'badge-akad','Tidak Teridentifikasi':'badge-tidak','Perlu Verifikasi':'badge-perlu'}[s]||'badge-perlu'; }

let toastTimer;
function showToast(msg){
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.add('hidden'),3500);
}
