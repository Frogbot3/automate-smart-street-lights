// Dashboard Global State
const state = {
    aiMode: true,
    totalLights: 12450,
    faults: 0,
    selectedZone: 'all',
    zones: {
        'dt': { name: 'Downtown', brightness: 80, lights: 4200, status: 'online' },
        'nw': { name: 'Northwood', brightness: 60, lights: 2100, status: 'online' },
        'ei': { name: 'East Ind.', brightness: 100, lights: 1800, status: 'online' },
        'se': { name: 'South End', brightness: 90, lights: 800, status: 'online' }
    },
    chartInstance: null
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initChart();
    initControls();
    updateDashboard();
});

function initChart() {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    // Dynamic chart color based on theme
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    Chart.defaults.color = isDark ? '#94a3b8' : '#64748b';
    Chart.defaults.font.family = "'Inter', sans-serif";

    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: getChartDataForZone('all'),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    backgroundColor: '#0f172a',
                    padding: 10,
                    displayColors: true
                }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
                x: { grid: { display: false } }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    });
}

function getChartDataForZone(zoneKey) {
    // Generate dummy data based on selection
    let base = 1000;
    let label = 'Energy Consumption (kWh)';
    
    if(zoneKey !== 'all') {
        const factor = state.zones[zoneKey].lights / state.totalLights;
        base = Math.round(1000 * factor);
    }

    // If AI is off, consumption goes up artificially
    const multiplier = state.aiMode ? 1 : 1.25;

    return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            label: label,
            data: [base*1.1, base*0.9, base*1.05, base*0.85, base*0.95, base*0.8, base*0.75].map(v => v * multiplier),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#fff',
            pointBorderColor: '#0ea5e9',
            fill: true,
            tension: 0.4
        },
        {
            label: 'Projected Baseline',
            data: [base*1.2, base*1.2, base*1.2, base*1.2, base*1.2, base*1.2, base*1.2],
            borderColor: '#94a3b8',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            tension: 0
        }]
    };
}

function updateChart() {
    if(state.chartInstance) {
        state.chartInstance.data = getChartDataForZone(state.selectedZone);
        state.chartInstance.update();
    }
}

function initControls() {
    // Select Zones
    window.selectZone = function(zoneKey) {
        document.querySelectorAll('.zone-card').forEach(c => c.classList.remove('selected'));
        
        if (state.selectedZone === zoneKey) {
            // Deselect
            state.selectedZone = 'all';
            document.getElementById('chart-title').textContent = 'Energy Performance: All Zones';
        } else {
            state.selectedZone = zoneKey;
            document.querySelector(`.zone-card[data-zone="${zoneKey}"]`).classList.add('selected');
            document.getElementById('chart-title').textContent = `Energy Performance: ${state.zones[zoneKey].name}`;
        }
        updateChart();
    };

    // Reset Zones
    window.resetZones = function() {
         document.querySelectorAll('.zone-card').forEach(c => c.classList.remove('selected'));
         state.selectedZone = 'all';
         document.getElementById('chart-title').textContent = 'Energy Performance: All Zones';
         updateChart();
    };

    // Sliders
    const sliders = document.querySelectorAll('.control-slider');
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const z = e.target.getAttribute('data-zone');
            state.zones[z].brightness = parseInt(e.target.value);
            document.getElementById(`val-${z}`).textContent = e.target.value + '%';
            updateDashboard();
        });
    });

    // Auto AI Toggle
    const autoToggle = document.getElementById('autoModeToggle');
    autoToggle.addEventListener('change', (e) => {
        state.aiMode = e.target.checked;
        document.getElementById('ai-mode-label').textContent = state.aiMode ? 'Auto AI On' : 'Manual Override';
        document.getElementById('ai-mode-label').className = state.aiMode ? 'text-primary font-medium' : 'text-muted font-medium';
        
        // Enable/disable sliders
        sliders.forEach(s => s.disabled = state.aiMode);

        if(state.aiMode) {
            // Snap back to optimized values
            const aiVals = { dt: 80, nw: 60, ei: 100, se: 90 };
            sliders.forEach(s => {
                const z = s.getAttribute('data-zone');
                s.value = aiVals[z];
                state.zones[z].brightness = aiVals[z];
                document.getElementById(`val-${z}`).textContent = aiVals[z] + '%';
            });
        }
        updateDashboard();
        updateChart();
    });
}

function updateDashboard() {
    // Calculate global brightness average mapped to lights count
    let totalWeightedBrightness = 0;
    let trackableLights = 0;
    
    for (let key in state.zones) {
        totalWeightedBrightness += (state.zones[key].brightness * state.zones[key].lights);
        trackableLights += state.zones[key].lights;
    }
    
    const avgBrightness = Math.round(totalWeightedBrightness / trackableLights);
    document.getElementById('stat-active').textContent = avgBrightness + '%';

    // Calculate energy saved (simulated logic based on brightness vs 100%)
    const maxEnergy = 6.0; // MW if everything 100%
    const currentEnergy = maxEnergy * (avgBrightness / 100);
    let saved = maxEnergy - currentEnergy;
    
    if(!state.aiMode) saved = saved * 0.5; // Penalty for manual

    document.getElementById('stat-saved').textContent = saved.toFixed(1) + ' MW';
}

// Fault Simulation Logic
let faultCounter = 100;
window.triggerSimulatedFault = function() {
    const zonesList = Object.keys(state.zones);
    const targetZone = zonesList[Math.floor(Math.random() * zonesList.length)];
    const zoneName = state.zones[targetZone].name;
    const faultId = `F-${faultCounter++}`;
    
    state.faults++;
    state.zones[targetZone].status = 'error';
    
    // Update UI Counters
    document.getElementById('stat-faulty').textContent = state.faults;
    document.getElementById('trend-faulty').textContent = `${state.faults} action required`;
    document.getElementById('nav-fault-badge').textContent = state.faults;
    document.getElementById('nav-fault-badge').style.display = 'block';
    
    // Flash card
    const faultCard = document.getElementById('card-faulty');
    faultCard.classList.remove('danger-flash');
    void faultCard.offsetWidth; // trigger reflow
    faultCard.classList.add('danger-flash');

    // Update Map Status
    document.getElementById(`status-${targetZone}`).className = 'zone-status error';

    // Spawn Log
    const li = document.createElement('li');
    li.className = 'fault-item new-fault';
    li.id = `log-${faultId}`;
    li.innerHTML = `
        <div class="fault-icon bg-red"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="fault-info">
            <h4>Node Failure Required</h4>
            <p>Node ID: #${targetZone.toUpperCase()}-${Math.floor(Math.random()*9000)+1000} (${zoneName})</p>
        </div>
        <div class="fault-time">
            <span>Just now</span>
            <button class="btn-resolve" onclick="resolveFault('${faultId}', '${targetZone}', this)">Resolve</button>
        </div>
    `;

    const list = document.getElementById('faultList');
    list.insertBefore(li, list.firstChild);
};

window.resolveFault = function(faultId, zoneKey, btnElement) {
    if(state.faults > 0) state.faults--;
    
    // Update counters
    document.getElementById('stat-faulty').textContent = state.faults;
    document.getElementById('trend-faulty').textContent = `${state.faults} action required`;
    
    if(state.faults === 0) {
        document.getElementById('nav-fault-badge').style.display = 'none';
    } else {
        document.getElementById('nav-fault-badge').textContent = state.faults;
    }

    // Set map status back to online (assuming no other faults, simplification)
    state.zones[zoneKey].status = 'online';
    document.getElementById(`status-${zoneKey}`).className = 'zone-status online';

    // Update log UI
    const li = document.getElementById(`log-${faultId}`);
    li.className = 'fault-item';
    li.querySelector('.fault-icon').className = 'fault-icon bg-green';
    li.querySelector('.fault-icon i').className = 'fa-solid fa-check';
    li.querySelector('h4').textContent = 'Node Restored';
    btnElement.remove(); // remove resolve button
};

function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    const icon = themeBtn.querySelector('i');
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('lumi-theme');
    if(savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.className = 'fa-solid fa-sun';
    }
    
    themeBtn.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        if(isDark) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('lumi-theme', 'light');
            icon.className = 'fa-solid fa-moon';
            Chart.defaults.color = '#64748b';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('lumi-theme', 'dark');
            icon.className = 'fa-solid fa-sun';
            Chart.defaults.color = '#94a3b8';
        }
        if(state.chartInstance) state.chartInstance.update();
    });
}
