/**
 * DOMRenderer - Optimized DOM rendering dengan security
 * @version 1.0.0
 */

import { Analytics } from './Analytics.js';

export class DOMRenderer {
    constructor() {
        this.bedahTable = document.getElementById("bedahBody");
        this.nonBedahTable = document.getElementById("nonBedahBody");
        this.cutiContainer = document.getElementById("cutiScrollContent");
    }

    /**
     * Render data ke table dengan DocumentFragment untuk performance
     * @param {Array} data - Data to render
     */
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

    /**
     * Render table data dengan DocumentFragment
     * @param {HTMLElement} container - Table container
     * @param {Array} data - Data to render
     */
    renderTable(container, data) {
        const fragment = document.createDocumentFragment();
        
        data.forEach(item => {
            const row = this.createTableRow(item);
            fragment.appendChild(row);
        });
        
        container.appendChild(fragment);
    }

    /**
     * Create table row element
     * @param {Object} item - Data item
     * @returns {HTMLElement}
     */
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

    /**
     * Initialize event delegation untuk cuti items
     */
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

    /**
     * Render cuti data
     * @param {Array} data - Cuti data
     */
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

    /**
     * Create cuti item element
     * @param {Object} doctor - Doctor data
     * @param {number} index - Item index
     * @returns {HTMLElement}
     */
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

    /**
     * Escape HTML untuk prevent XSS
     * @param {string} text - Text to escape
     * @returns {string}
     */
    escapeHtml(text) {
        if (text == null) return '';
        
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /**
     * Get initials from name
     * @param {string} name - Full name
     * @returns {string}
     */
    getInitials(name) {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    /**
     * Get status class dari status text
     * @param {string} status - Status text
     * @returns {string}
     */
    getStatusClass(status) {
        if (!status) return 'TIDAK';
        
        const statusUpper = status.toUpperCase();
        if (statusUpper.includes('BUKA')) return 'BUKA';
        if (statusUpper.includes('PENUH')) return 'PENUH';
        if (statusUpper.includes('SELESAI')) return 'SELESAI';
        if (statusUpper.includes('CUTI')) return 'CUTI';
        if (statusUpper.includes('TIDAK ADA POLI') || statusUpper.includes('TIDAK-ADA-POLI')) return 'TIDAK-ADA-POLI';
        if (statusUpper.includes('TIDAK')) return 'TIDAK';
        
        return 'TIDAK';
    }

    /**
     * Parse cuti status dari tanggal
     * @param {string} dateText - Date text
     * @returns {Object}
     */
    parseCutiStatus(dateText) {
        const today = new Date();
        const currentYear = today.getFullYear();
        
        const patterns = [
            /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*([A-Za-z]+)/i,
            /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*([A-Za-z]+)\s*(\d{4})?/i,
        ];

        for (let pattern of patterns) {
            const match = dateText.match(pattern);
            if (match) {
                let startDate, endDate;
                
                if (pattern === patterns[0] || pattern === patterns[1]) {
                    const startDay = parseInt(match[1]);
                    const endDay = parseInt(match[2]);
                    const monthName = match[3];
                    const year = match[4] ? parseInt(match[4]) : currentYear;
                    
                    const month = this.getMonthNumber(monthName);
                    if (month !== -1) {
                        startDate = new Date(year, month, startDay);
                        endDate = new Date(year, month, endDay);
                    }
                }

                if (startDate && endDate) {
                    if (today < startDate) {
                        return { badgeClass: 'cuti-date-upcoming', statusText: 'AKAN CUTI' };
                    } else if (today > endDate) {
                        return { badgeClass: 'cuti-date-finished', statusText: 'SELESAI' };
                    } else {
                        return { badgeClass: 'cuti-date-ongoing', statusText: 'SEDANG CUTI' };
                    }
                }
            }
        }

        return { badgeClass: 'cuti-badge', statusText: 'CUTI' };
    }

    /**
     * Get month number from month name
     * @param {string} monthName - Month name
     * @returns {number}
     */
    getMonthNumber(monthName) {
        const months = {
            'januari': 0, 'februari': 1, 'maret': 2, 'april': 3, 'mei': 4, 'juni': 5,
            'juli': 6, 'agustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'desember': 11,
            'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
            'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11
        };
        return months[monthName.toLowerCase()] !== undefined ? months[monthName.toLowerCase()] : -1;
    }

    /**
     * Show cuti detail modal
     * @param {string} nama - Doctor name
     * @param {string} spesialis - Specialist
     * @param {string} tanggal - Date
     * @param {string} badgeClass - Badge class
     */
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

    /**
     * Get status text from badge class
     * @param {string} badgeClass - Badge class
     * @returns {string}
     */
    getStatusTextFromBadge(badgeClass) {
        switch(badgeClass) {
            case 'cuti-date-upcoming': return 'AKAN CUTI';
            case 'cuti-date-finished': return 'SELESAI';
            case 'cuti-date-ongoing': return 'SEDANG CUTI';
            default: return 'CUTI';
        }
    }

    /**
     * Show empty state
     */
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

    /**
     * Show skeleton loading
     */
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

    /**
     * Animate sections
     */
    animateSections() {
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('show');
            setTimeout(() => sec.classList.add('show'), 100);
        });
    }
}
