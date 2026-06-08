let placementDataGlobal = null;
let currentCompany = "";
let chartInstances = {};
let currentStatsRange = 6;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    if (typeof placementData !== 'undefined') {
        placementDataGlobal = placementData;
        initializeDashboard(placementDataGlobal);
    } else {
        console.error("placementData is not defined. Ensure data.js is loaded correctly.");
    }
});

function initializeDashboard(data) {
    populateGlobalFilter(data);
    
    // Initial Render
    updateDashboardView();

    // Event Listeners for Filters/Search
    document.getElementById('global-company-filter').addEventListener('change', (e) => {
        currentCompany = e.target.value;
        updateDashboardView();
    });

    setupSearchAndSort();
}

function populateGlobalFilter(data) {
    const globalSelect = document.getElementById('global-company-filter');
    const allCompanies = new Set([
        ...data.full_stats.map(c => c['Recruitment Team Visited']),
        ...data.internship.map(c => c['Company Name']),
        ...data.students.map(s => s['Company Name'])
    ].filter(Boolean));

    const sortedCompanies = [...allCompanies].sort();
    sortedCompanies.forEach(c => {
        globalSelect.add(new Option(c, c));
    });
}

function updateDashboardView() {
    const data = placementDataGlobal;
    
    // Filter data based on global selection
    const filteredPlacements = currentCompany ? 
        data.full_stats.filter(c => c['Recruitment Team Visited'] === currentCompany) : data.full_stats;
        
    const filteredInternships = currentCompany ? 
        data.internship.filter(c => c['Company Name'] === currentCompany) : data.internship;
        
    const filteredStudents = currentCompany ? 
        data.students.filter(s => s['Company Name'] === currentCompany) : data.students;

    updateProfileCard(filteredPlacements, filteredInternships);
    updateMetrics(filteredPlacements, filteredInternships, data.full_stats.length);
    renderCharts(filteredPlacements, filteredInternships);
    
    // Reset local table search
    document.getElementById('search-placements').value = '';
    document.getElementById('search-internships').value = '';
    document.getElementById('search-students').value = '';
    
    renderPlacementsTable(filteredPlacements);
    renderInternshipsTable(filteredInternships);
    renderStudentsTable(filteredStudents);
    renderStatisticsTable(filteredStudents, currentStatsRange);
    renderBranchStatisticsTable(filteredStudents);
}

function updateProfileCard(placements, internships) {
    const profileCard = document.getElementById('company-profile-card');
    const badge = document.getElementById('current-view-badge');
    const companiesMetric = document.getElementById('metric-card-companies');

    if (!currentCompany) {
        profileCard.style.display = 'none';
        companiesMetric.style.display = 'flex';
        badge.textContent = 'All Companies';
        return;
    }

    badge.textContent = currentCompany;
    profileCard.style.display = 'flex';
    companiesMetric.style.display = 'none';

    document.getElementById('profile-name').textContent = currentCompany;
    
    // Get best available data
    const pData = placements.length > 0 ? placements[0] : null;
    const iData = internships.length > 0 ? internships[0] : null;

    document.getElementById('profile-category').textContent = 
        (pData && pData['Category']) || (iData && iData['Category']) || 'Unknown Category';
        
    const dateStr = pData && pData['Date of Visit/Result announce'];
    document.getElementById('profile-date').textContent = dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A';

    document.getElementById('profile-ctc').textContent = pData && pData['CTC(Lakhs per annum)'] ? 
        pData['CTC(Lakhs per annum)'] + ' LPA' : 'N/A';
        
    document.getElementById('profile-stipend').textContent = iData && iData['Stipend'] ? 
        '₹' + iData['Stipend'] : 'N/A';
}

function updateMetrics(placements, internships, totalGlobalCompanies) {
    let totalPlacements = 0;
    let highestCTC = 0;
    let totalInternships = 0;

    placements.forEach(comp => {
        const total = parseInt(comp['BE Total']);
        if (!isNaN(total)) totalPlacements += total;

        const ctc = parseFloat(comp['CTC(Lakhs per annum)']);
        if (!isNaN(ctc) && ctc > highestCTC) highestCTC = ctc;
    });

    internships.forEach(comp => {
        const total = parseInt(comp['BE Total']);
        if (!isNaN(total)) totalInternships += total;
    });

    document.getElementById('metric-placements').textContent = totalPlacements;
    document.getElementById('metric-highest-ctc').textContent = highestCTC > 0 ? highestCTC.toFixed(2) : '--';
    document.getElementById('metric-internships').textContent = totalInternships;
    
    if (!currentCompany) {
        document.getElementById('metric-companies').textContent = totalGlobalCompanies;
    }
}

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
    }
}

function renderCharts(placements, internships) {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    const branchColors = [
        'rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 
        'rgba(139, 92, 246, 0.8)', 'rgba(245, 158, 11, 0.8)',
        'rgba(236, 72, 153, 0.8)', 'rgba(14, 165, 233, 0.8)',
        'rgba(244, 63, 94, 0.8)', 'rgba(34, 197, 94, 0.8)'
    ];

    const branches = ['CV', 'BT', 'CH', 'CS', 'AIML', 'CC', 'IT', 'DS', 'BM', 'EC', 'EE', 'EI', 'CPS', 'AE', 'AU', 'IP', 'ME', 'MT'];
    
    // 1. Placements Branch Chart
    const branchTotals = {};
    branches.forEach(b => branchTotals[b] = 0);
    placements.forEach(comp => {
        branches.forEach(b => {
            const val = parseInt(comp[b]);
            if (!isNaN(val)) branchTotals[b] += val;
        });
    });

    const activeBranches = branches.filter(b => branchTotals[b] > 0);
    const activeValues = activeBranches.map(b => branchTotals[b]);

    destroyChart('branchChart');
    const ctxBranch = document.getElementById('branchChart').getContext('2d');
    chartInstances['branchChart'] = new Chart(ctxBranch, {
        type: 'bar',
        data: {
            labels: activeBranches,
            datasets: [{
                label: 'Total Placements',
                data: activeValues,
                backgroundColor: branchColors[0],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }, x: { grid: { display: false } } }
        }
    });

    // 2. Internships Branch Chart
    const internTotals = {};
    branches.forEach(b => internTotals[b] = 0);
    internships.forEach(comp => {
        branches.forEach(b => {
            const val = parseInt(comp[b]);
            if (!isNaN(val)) internTotals[b] += val;
        });
    });

    const activeInternBranches = branches.filter(b => internTotals[b] > 0);
    const activeInternValues = activeInternBranches.map(b => internTotals[b]);

    destroyChart('internshipBranchChart');
    const ctxInternBranch = document.getElementById('internshipBranchChart').getContext('2d');
    chartInstances['internshipBranchChart'] = new Chart(ctxInternBranch, {
        type: 'bar',
        data: {
            labels: activeInternBranches,
            datasets: [{
                label: 'Total Internships',
                data: activeInternValues,
                backgroundColor: branchColors[1],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }, x: { grid: { display: false } } }
        }
    });

    // Handle Top Recruiters & Stipends (Only makes sense globally, hide if specific company selected)
    const recruiterContainer = document.getElementById('recruiterChart').parentElement;
    const stipendContainer = document.getElementById('stipendChartContainer');

    if (currentCompany) {
        recruiterContainer.style.display = 'none';
        stipendContainer.style.display = 'none';
    } else {
        recruiterContainer.style.display = 'flex';
        stipendContainer.style.display = 'flex';

        // Recruiter Doughnut
        const recruiters = [...placements].map(c => ({
            name: c['Recruitment Team Visited'],
            total: parseInt(c['BE Total']) || 0
        })).sort((a, b) => b.total - a.total).slice(0, 5);

        destroyChart('recruiterChart');
        const ctxRecruiter = document.getElementById('recruiterChart').getContext('2d');
        chartInstances['recruiterChart'] = new Chart(ctxRecruiter, {
            type: 'doughnut',
            data: {
                labels: recruiters.map(r => r.name),
                datasets: [{
                    data: recruiters.map(r => r.total),
                    backgroundColor: branchColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right' } }, cutout: '70%'
            }
        });

        // Top Stipends
        const stipends = [...internships].map(c => ({
            name: c['Company Name'],
            stipend: parseFloat(c['Stipend']) || 0
        })).sort((a, b) => b.stipend - a.stipend).slice(0, 5);

        destroyChart('stipendChart');
        const ctxStipend = document.getElementById('stipendChart').getContext('2d');
        chartInstances['stipendChart'] = new Chart(ctxStipend, {
            type: 'bar',
            data: {
                labels: stipends.map(s => s.name),
                datasets: [{
                    label: 'Stipend',
                    data: stipends.map(s => s.stipend),
                    backgroundColor: branchColors[2],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } }, x: { grid: { display: false } } }
            }
        });
    }
}

// Table Rendering
function renderPlacementsTable(stats) {
    const tbody = document.querySelector('#placements-table tbody');
    tbody.innerHTML = '';
    stats.forEach(comp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="company-name-cell"><strong>${comp['Recruitment Team Visited'] || '-'}</strong></div></td>
            <td><span class="badge">${comp['Category'] || '-'}</span></td>
            <td>${comp['Date of Visit/Result announce'] ? new Date(comp['Date of Visit/Result announce']).toLocaleDateString() : '-'}</td>
            <td>${comp['BE Total'] || '0'}</td>
            <td><span style="color: var(--success-color); font-weight:600;">${comp['CTC(Lakhs per annum)'] || '-'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderInternshipsTable(stats) {
    const tbody = document.querySelector('#internships-table tbody');
    tbody.innerHTML = '';
    stats.forEach(comp => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="company-name-cell"><strong>${comp['Company Name'] || '-'}</strong></div></td>
            <td>${comp['Duration'] || '-'}</td>
            <td><span class="badge">${comp['Category'] || '-'}</span></td>
            <td>${comp['BE Total'] || '0'}</td>
            <td><span style="color: var(--accent-color); font-weight:600;">${comp['Stipend'] || '-'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderStudentsTable(students) {
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';
    students.forEach(student => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="company-name-cell"><strong>${student['Name'] || '-'}</strong><small>${student['Reg. No.'] || ''}</small></div></td>
            <td><span class="badge">${student['Branch'] || '-'}</span></td>
            <td>${student['CGPA'] || '-'}</td>
            <td>${student['Company Name'] || '-'}</td>
            <td>${student['CTC'] ? '<span style="color:var(--success-color)">' + (student['CTC']/100000).toFixed(2) + ' LPA</span>' : '<span style="color:var(--accent-color)">' + (student['Stipend'] || '-') + '</span>'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Local Search and Sort
let currentTableData = {
    placements: [],
    internships: [],
    students: []
};

function setupSearchAndSort() {
    const handleSearch = () => {
        const pSearch = document.getElementById('search-placements').value.toLowerCase();
        const baseP = currentCompany ? placementDataGlobal.full_stats.filter(c => c['Recruitment Team Visited'] === currentCompany) : placementDataGlobal.full_stats;
        currentTableData.placements = baseP.filter(c => (c['Recruitment Team Visited'] || '').toLowerCase().includes(pSearch) || (c['Category'] || '').toLowerCase().includes(pSearch));
        renderPlacementsTable(currentTableData.placements);

        const iSearch = document.getElementById('search-internships').value.toLowerCase();
        const baseI = currentCompany ? placementDataGlobal.internship.filter(c => c['Company Name'] === currentCompany) : placementDataGlobal.internship;
        currentTableData.internships = baseI.filter(c => (c['Company Name'] || '').toLowerCase().includes(iSearch) || (c['Category'] || '').toLowerCase().includes(iSearch));
        renderInternshipsTable(currentTableData.internships);

        const sSearch = document.getElementById('search-students').value.toLowerCase();
        const baseS = currentCompany ? placementDataGlobal.students.filter(s => s['Company Name'] === currentCompany) : placementDataGlobal.students;
        currentTableData.students = baseS.filter(s => (s['Name'] || '').toLowerCase().includes(sSearch) || (s['Branch'] || '').toLowerCase().includes(sSearch) || (s['Company Name'] || '').toLowerCase().includes(sSearch));
        renderStudentsTable(currentTableData.students);
    };

    document.querySelectorAll('.search-input').forEach(el => {
        if(el.id !== 'global-company-filter') {
            el.addEventListener('input', handleSearch);
        }
    });

    let internSortDesc = true;
    document.getElementById('sort-stipend-intern').addEventListener('click', (e) => {
        internSortDesc = !internSortDesc;
        e.target.textContent = internSortDesc ? 'Stipend ↓' : 'Stipend ↑';
        const data = currentTableData.internships.length ? currentTableData.internships : (currentCompany ? placementDataGlobal.internship.filter(c => c['Company Name'] === currentCompany) : placementDataGlobal.internship);
        data.sort((a, b) => {
            const valA = parseFloat(a['Stipend']) || 0;
            const valB = parseFloat(b['Stipend']) || 0;
            return internSortDesc ? valB - valA : valA - valB;
        });
        renderInternshipsTable(data);
    });

    let studentSortDesc = true;
    document.getElementById('sort-stipend-student').addEventListener('click', (e) => {
        studentSortDesc = !studentSortDesc;
        e.target.textContent = studentSortDesc ? 'CTC / Stipend ↓' : 'CTC / Stipend ↑';
        const data = currentTableData.students.length ? currentTableData.students : (currentCompany ? placementDataGlobal.students.filter(s => s['Company Name'] === currentCompany) : placementDataGlobal.students);
        data.sort((a, b) => {
            const getVal = (s) => parseFloat(s['CTC']) || parseFloat(s['Stipend']) || 0;
            const valA = getVal(a);
            const valB = getVal(b);
            return studentSortDesc ? valB - valA : valA - valB;
        });
        renderStudentsTable(data);
    });

    const stdBtn = document.getElementById('stats-tab-standard');
    const detBtn = document.getElementById('stats-tab-detailed');
    
    stdBtn.addEventListener('click', () => {
        currentStatsRange = 6;
        stdBtn.classList.add('badge-accent');
        detBtn.classList.remove('badge-accent');
        const data = currentCompany ? placementDataGlobal.students.filter(s => s['Company Name'] === currentCompany) : placementDataGlobal.students;
        renderStatisticsTable(data, currentStatsRange);
    });

    detBtn.addEventListener('click', () => {
        currentStatsRange = 3;
        detBtn.classList.add('badge-accent');
        stdBtn.classList.remove('badge-accent');
        const data = currentCompany ? placementDataGlobal.students.filter(s => s['Company Name'] === currentCompany) : placementDataGlobal.students;
        renderStatisticsTable(data, currentStatsRange);
    });
}

function renderStatisticsTable(students, rangeSize = 6) {
    const tbody = document.querySelector('#statistics-table tbody');
    tbody.innerHTML = '';

    const bins = {};

    students.forEach(s => {
        const ctcRaw = parseFloat(s['CTC']);
        const cgpa = parseFloat(s['CGPA']);

        if (!isNaN(ctcRaw) && ctcRaw > 0 && !isNaN(cgpa)) {
            const lpa = ctcRaw / 100000;
            let binIndex = Math.floor(lpa / rangeSize);
            if (lpa > 0 && lpa % rangeSize === 0) {
                if (lpa === rangeSize * binIndex) {
                    binIndex -= 1;
                }
            }
            if (binIndex < 0) binIndex = 0;
            
            const rangeStart = binIndex * rangeSize;
            const rangeEnd = rangeStart + rangeSize;
            const rangeLabel = `${rangeStart}-${rangeEnd}L`;

            if (!bins[rangeLabel]) {
                bins[rangeLabel] = { ctcSort: rangeStart, cgpas: [] };
            }
            bins[rangeLabel].cgpas.push(cgpa);
        }
    });

    const binArray = Object.keys(bins).map(key => ({
        label: key,
        ctcSort: bins[key].ctcSort,
        cgpas: bins[key].cgpas.sort((a, b) => a - b)
    })).sort((a, b) => a.ctcSort - b.ctcSort);

    binArray.forEach(bin => {
        const cgpas = bin.cgpas;
        const count = cgpas.length;
        
        const avg = cgpas.reduce((a, b) => a + b, 0) / count;
        const mid = Math.floor(count / 2);
        const median = count % 2 !== 0 ? cgpas[mid] : (cgpas[mid - 1] + cgpas[mid]) / 2;
        const minCGPA = Math.min(...cgpas);
        const maxCGPA = Math.max(...cgpas);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge badge-accent">${bin.label}</span></td>
            <td>${count}</td>
            <td>${avg.toFixed(2)}</td>
            <td>${median.toFixed(2)}</td>
            <td>${minCGPA.toFixed(2)}</td>
            <td>${maxCGPA.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBranchStatisticsTable(students) {
    const tbody = document.querySelector('#branch-statistics-table tbody');
    tbody.innerHTML = '';

    const branchData = {};

    students.forEach(s => {
        const branch = s['Branch'];
        const ctc = parseFloat(s['CTC']);
        const cgpa = parseFloat(s['CGPA']);

        if (branch) {
            if (!branchData[branch]) {
                branchData[branch] = { ctcs: [], cgpas: [] };
            }
            if (!isNaN(ctc) && ctc > 0) {
                branchData[branch].ctcs.push(ctc / 100000);
            }
            if (!isNaN(cgpa)) {
                branchData[branch].cgpas.push(cgpa);
            }
        }
    });

    const branchArray = Object.keys(branchData).map(branch => {
        const ctcs = branchData[branch].ctcs.sort((a, b) => a - b);
        const cgpas = branchData[branch].cgpas.sort((a, b) => a - b);
        
        const meanCTC = ctcs.length > 0 ? ctcs.reduce((a, b) => a + b, 0) / ctcs.length : 0;
        let medianCTC = 0;
        if (ctcs.length > 0) {
            const mid = Math.floor(ctcs.length / 2);
            medianCTC = ctcs.length % 2 !== 0 ? ctcs[mid] : (ctcs[mid - 1] + ctcs[mid]) / 2;
        }

        const meanCGPA = cgpas.length > 0 ? cgpas.reduce((a, b) => a + b, 0) / cgpas.length : 0;
        let medianCGPA = 0;
        if (cgpas.length > 0) {
            const mid = Math.floor(cgpas.length / 2);
            medianCGPA = cgpas.length % 2 !== 0 ? cgpas[mid] : (cgpas[mid - 1] + cgpas[mid]) / 2;
        }

        return {
            branch: branch,
            placedCount: cgpas.length,
            meanCTC: meanCTC,
            medianCTC: medianCTC,
            meanCGPA: meanCGPA,
            medianCGPA: medianCGPA
        };
    }).sort((a, b) => b.placedCount - a.placedCount);

    branchArray.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="badge">${b.branch}</span></td>
            <td>${b.placedCount}</td>
            <td>${b.meanCTC > 0 ? b.meanCTC.toFixed(2) + ' L' : '-'}</td>
            <td>${b.medianCTC > 0 ? b.medianCTC.toFixed(2) + ' L' : '-'}</td>
            <td>${b.meanCGPA > 0 ? b.meanCGPA.toFixed(2) : '-'}</td>
            <td>${b.medianCGPA > 0 ? b.medianCGPA.toFixed(2) : '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}
