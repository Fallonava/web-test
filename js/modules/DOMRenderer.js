import { Analytics } from './Analytics.js';

export class DOMRenderer {
  constructor() {
    this.bedahTable = document.getElementById("bedahBody");
    this.nonBedahTable = document.getElementById("nonBedahBody");
    this.cutiContainer = document.getElementById("cutiScrollContent");
  }

  // 🚀 OPTIMIZED RENDERING DENGAN DOCUMENT FRAGMENT
  renderData(data) {
    const startTime = performance.now();
    
    if (!data || data.length === 0) {
      this.showEmptyState();
      return;
    }

    const bedahData = data.filter(item => item.Jenis === "Bedah");
    const nonBedahData = data.filter(item => item.Jenis !== "Bedah");

    // Clear tables efficiently
    this.bedahTable.textContent = '';
    this.nonBedahTable.textContent = '';

    // Render dengan DocumentFragment untuk performance
    this.renderTable(this.bedahTable, bedahData);
    this.renderTable(this.nonBedahTable, nonBedahData);

    // Animate sections
    this.animateSections();

    const duration = performance.now() - startTime;
    Analytics.trackPerformance('DOMRender', duration, { 
      totalItems: data.length,
      bedahItems: bedahData.length,
      nonBedahItems: nonBedahData.length
    });

    console.log(`✅ Rendered ${data.length} items in ${duration.toFixed(2)}ms`);
  }

  renderTable(container, data) {
    const fragment = document.createDocumentFragment();
    
    data.forEach(item => {
      const row = this.createTableRow(item);
      fragment.appendChild(row);
    });
    
    container.appendChild(fragment);
  }

  createTableRow(item) {
    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '0');
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `Dr. ${this.escapeHtml(item.Dokter || '-')} - ${this.escapeHtml(item.Spesialis || '-')}`);
    
    const statusClass = this.getStatusClass(item.Status);
    
    tr.innerHTML = `
      <td>${this.escapeHtml(item.Spesialis || '-')}</td>
      <td>${this.escapeHtml(item.Dokter || '-')}</td>
      <td><span class="status ${statusClass}" tabindex="0" aria-label="Status: ${statusClass.replace('-', ' ')}">${this.escapeHtml(item.Status || 'TIDAK')}</span></td>
      <td>${this.escapeHtml(item.Jam || '-')}</td>
    `;
    
    return tr;
  }

  // 🛡️ SECURE EVENT DELEGATION UNTUK CUTI ITEMS
  initializeCutiEvents() {
    // Event delegation untuk cuti items
    this.cutiContainer.addEventListener('click', (e) => {
      const cutiItem = e.target.closest('.cuti-item');
      if (cutiItem) {
        const { nama, spesialis, tanggal, badgeClass } = cutiItem.dataset;
        this.showCutiDetail(nama, spesialis, tanggal, badgeClass);
      }
    });

    // Keyboard navigation
    this.cutiContainer.addEventListener('keydown', (e) => {
      const cutiItem = e.target.closest('.cuti-item');
      if (cutiItem && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        const { nama, spesialis, tanggal, badgeClass } = cutiItem.dataset;
        this.showCutiDetail(nama, spesialis, tanggal, badgeClass);
      }
    });
  }

  renderCutiData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      this.cutiContainer.innerHTML = '<div class="cuti-empty">Tidak ada dokter yang sedang cuti</div>';
      return;
    }

    const fragment = document.createDocumentFragment();
    let validCutiCount = 0;

    data.forEach((doctor, index) => {
      try {
        const cutiItem = this.createCutiItem(doctor, index);
        if (cutiItem) {
          fragment.appendChild(cutiItem);
          validCutiCount++;
        }
      } catch (error) {
        console.error('Error creating cuti item:', error, doctor);
      }
    });

    this.cutiContainer.textContent = '';
    this.cutiContainer.appendChild(fragment);

    if (validCutiCount === 0) {
      this.cutiContainer.innerHTML = '<div class="cuti-empty">Tidak ada data cuti yang valid</div>';
    }

    console.log(`✅ Displayed ${validCutiCount} cuti doctors`);
  }

  createCutiItem(doctor, index) {
    const namaDokter = doctor.Dokter || doctor.Nama || doctor['Nama Dokter'];
    if (!namaDokter) return null;

    const spesialis = doctor.Spesialis || doctor.Poli || doctor['Spesialisasi'] || 'Spesialis';
    const tanggalCuti = doctor.Tanggal || doctor.Period || doctor.Jam || doctor['Periode Cuti'] || 'Cuti';
    const initials = this.getInitials(namaDokter);
    const statusInfo = this.parseCutiStatus(tanggalCuti);

    const div = document.createElement('div');
    div.className = 'cuti-item';
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label', `Cuti dokter ${namaDokter}`);
    
    // Store data securely in dataset
    div.dataset.nama = this.escapeHtml(namaDokter);
    div.dataset.spesialis = this.escapeHtml(spesialis);
    div.dataset.tanggal = this.escapeHtml(tanggalCuti);
    div.dataset.badgeClass = statusInfo.badgeClass;

    div.innerHTML = `
      <div class="cuti-avatar" title="${this.escapeHtml(namaDokter)}">${initials}</div>
      <div class="cuti-info">
        <div class="cuti-name-row">
          <span class="cuti-dokter-name">${this.escapeHtml(namaDokter)}</span>
          <span class="cuti-separator">-</span>
          <span class="cuti-spesialis">${this.escapeHtml(spesialis)}</span>
        </div>
        <div class="cuti-date-row">
          <span class="cuti-date-icon">📅</span>
          <span>${this.escapeHtml(tanggalCuti)}</span>
        </div>
      </div>
      <div class="cuti-badge ${statusInfo.badgeClass}">${statusInfo.statusText}</div>
    `;

    return div;
  }

  // 🛡️ SECURITY UTILITIES
  escapeHtml(text) {
    if (text == null) return '';
    
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  getInitials(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStatusClass(status) {
    if (!status) return 'TIDAK';
    
    const statusUpper = status.toUpperCase();
    if (statusUpper.includes('BUKA')) return 'BUKA';
    if (statusUpper.includes('PENUH')) return 'PENUFULL';
    if (statusUpper.includes('SELESAI')) return 'SELESAI';
    if (statusUpper.includes('CUTI')) return 'CUTI';
    if (statusUpper.includes('TIDAK ADA POLI') || statusUpper.includes('TIDAK-ADA-POLI')) return 'TIDAK-ADA-POLI';
    if (statusUpper.includes('TIDAK')) return 'TIDAK';
    
    return 'TIDAK';
  }

  parseCutiStatus(dateText) {
    // Implementation sama seperti sebelumnya
    // ... (code dari fungsi parseCutiStatus sebelumnya)
    
    return { badgeClass: 'cuti-badge', statusText: 'CUTI' };
  }

  showCutiDetail(nama, spesialis, tanggal, badgeClass = 'cuti-badge') {
    const modal = document.getElementById('cutiDetailModal');
    const content = document.getElementById('cutiDetailContent');
    const statusText = this.getStatusTextFromBadge(badgeClass);
    
    content.innerHTML = `
      <div class="cuti-detail-item">
        <div class="cuti-detail-avatar">${this.getInitials(nama)}</div>
        <div class="cuti-detail-info">
          <div class="cuti-detail-name">${nama}</div>
          <div class="cuti-detail-spec">${spesialis}</div>
          <div class="cuti-detail-dates">
            <span>📅 ${tanggal}</span>
          </div>
        </div>
        <div class="cuti-detail-status ${badgeClass}">${statusText}</div>
      </div>
    `;
    
    modal.classList.add('active');
    modal.focus();
  }

  getStatusTextFromBadge(badgeClass) {
    switch(badgeClass) {
      case 'cuti-date-upcoming': return 'AKAN CUTI';
      case 'cuti-date-finished': return 'SELESAI';
      case 'cuti-date-ongoing': return 'SEDANG CUTI';
      default: return 'CUTI';
    }
  }

  showEmptyState() {
    const emptyHTML = `
      <tr>
        <td colspan="4" class="error-message">
          📝 Tidak ada data jadwal dokter yang tersedia.
        </td>
      </tr>
    `;
    
    this.bedahTable.innerHTML = emptyHTML;
    this.nonBedahTable.innerHTML = emptyHTML;
  }

  animateSections() {
    document.querySelectorAll('.section').forEach(sec => {
      sec.classList.remove('show');
      setTimeout(() => sec.classList.add('show'), 100);
    });
  }

  showSkeletonLoading() {
    const skeletonRow = `
      <tr class="skeleton-row">
        <td><div class="skeleton"></div></td>
        <td><div class="skeleton"></div></td>
        <td><div class="skeleton skeleton-status"></div></td>
        <td><div class="skeleton"></div></td>
      </tr>
    `;
    
    this.bedahTable.innerHTML = skeletonRow.repeat(3);
    this.nonBedahTable.innerHTML = skeletonRow.repeat(5);
    
    this.animateSections();
  }
}