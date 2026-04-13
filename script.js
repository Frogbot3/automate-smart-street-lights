document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initSliders();
    simulateLiveData();
});

function initChart() {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    // Gradient for the chart line
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    // Common styling
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Energy Consumption (kWh)',
                data: [1200, 1150, 1100, 1050, 1080, 950, 900],
                borderColor: '#00f0ff',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#070b19',
                pointBorderColor: '#00f0ff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Projected Baseline (No AI)',
                data: [1300, 1300, 1300, 1300, 1300, 1300, 1300],
                borderColor: 'rgba(244, 63, 94, 0.5)',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 15, 30, 0.9)',
                    titleColor: '#f8fafc',
                    bodyColor: '#f8fafc',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });

    // Handle Chart Buttons
    const buttons = document.querySelectorAll('.chart-controls button');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function initSliders() {
    const autoModeToggle = document.getElementById('autoModeToggle');
    const sliders = document.querySelectorAll('.glass-slider');
    const values = {
        'slider-dt': document.getElementById('val-dt'),
        'slider-nw': document.getElementById('val-nw'),
        'slider-ei': document.getElementById('val-ei')
    };

    // Toggle Auto AI mode
    autoModeToggle.addEventListener('change', (e) => {
        const isAuto = e.target.checked;
        sliders.forEach(slider => {
            slider.disabled = isAuto;
        });
        
        if (isAuto) {
            // Restore to AI optimized values visually
            simulateAIAdjustment();
        }
    });

    // Update value displays
    sliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
            const valDisplay = values[e.target.id];
            if (valDisplay) {
                valDisplay.textContent = e.target.value + '%';
            }
        });
    });

    function simulateAIAdjustment() {
        // Automatically smoothly adjust sliders back to "AI efficient" levels
        const aiTargets = {
            'slider-dt': 80,
            'slider-nw': 60,
            'slider-ei': 100
        };

        sliders.forEach(slider => {
            const target = aiTargets[slider.id];
            slider.value = target;
            const valDisplay = values[slider.id];
            if(valDisplay) valDisplay.textContent = target + '%';
        });
    }
}

function simulateLiveData() {
    // Random pulses for active zones to make it feel alive
    const zones = document.querySelectorAll('.zone-status');
    
    setInterval(() => {
        const randomZone = zones[Math.floor(Math.random() * zones.length)];
        // Temporarily brighten the glow
        randomZone.style.filter = 'brightness(1.8)';
        
        setTimeout(() => {
            randomZone.style.filter = 'brightness(1)';
        }, 500);
    }, 2000);

    // Simulate arriving of a new fault log after 5s
    setTimeout(() => {
        addNewFaultLog();
    }, 5000);
}

function addNewFaultLog() {
    const faultList = document.getElementById('faultList');
    
    // Create new list item
    const li = document.createElement('li');
    li.className = 'fault-item new';
    li.style.animation = 'fadeInUp 0.5s ease-out';
    
    li.innerHTML = `
        <div class="fault-icon warning"><i class="fa-solid fa-temperature-arrow-up"></i></div>
        <div class="fault-info">
            <h4>Overheating Alert</h4>
            <p>Node ID: #NW-998 (Northwood)</p>
        </div>
        <span class="fault-time">Just now</span>
    `;

    // Insert at top
    faultList.insertBefore(li, faultList.firstChild);
    
    // Remove the last item to keep UI clean
    if(faultList.children.length > 3) {
        faultList.removeChild(faultList.lastChild);
    }
}
