let trainingLoadHistory = [];
let ctlChart = null;


async function fetchTrainingLoad() {
    try {
        const response = await fetch('/api/daily-stress');
        return await response.json();
    } catch (error) {
        console.error('Error fetching training load:', error);
        return null;
    }
}

async function fetchHistoricalData(sessionType) {
    try {
        const response = await fetch(`/api/historical-data/${sessionType}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

async function updateDisplay() {
    try {
        // Get latest training load
        const currentLoad = await fetchTrainingLoad();
        if (currentLoad) {
            displayTrainingLoad(currentLoad);
        }
        
        // Update chart
        createCtlChart();
    } catch (error) {
        console.error('Error updating display:', error);
    }
}

function displayTrainingLoad(load) {
    const container = document.getElementById('training-load-container');
    if (!container) return;

    const tsbClass = load.tsb >= 0 ? 'positive-tsb' : 'negative-tsb';
    
    container.innerHTML = `
        <table id="training-load-table">
            <tr>
                <th>Date</th>
                <th>Daily Stress</th>
                <th>CTL</th>
                <th>ATL</th>
                <th class="${tsbClass}">TSB</th>
            </tr>
            <tr>
                <td>${load.date}</td>
                <td>${load.daily_stress.toFixed(1)}</td>
                <td>${load.ctl.toFixed(1)}</td>
                <td>${load.atl.toFixed(1)}</td>
                <td class="${tsbClass}">${load.tsb.toFixed(1)}</td>
            </tr>
        </table>
    `;
}

async function createCtlChart() {
    try {

        if (ctlChart) {
            ctlChart.destroy();
        }

        const isDarkMode = document.body.classList.contains('dark-mode');
        const ctx = document.getElementById('ctl-chart').getContext('2d');

        // Fetch all historical data
        const [bouldering, endurance, hangboard, trainingLoad] = await Promise.all([
            fetchHistoricalData('bouldering'),
            fetchHistoricalData('endurance'),
            fetchHistoricalData('hangboard'),
            fetchHistoricalData('training_load')
        ]);

        ctlChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Bouldering CTSS',
                        data: bouldering.map(i => ({ x: i.date, y: i.total_ctss })),
                        borderColor: isDarkMode ? '#ff6ad5' : '#4bc0c0',  // Keep iconic pink
                        tension: 0.1
                    },
                    {
                        label: 'Endurance CTSS',
                        data: endurance.map(i => ({ x: i.date, y: i.total_ctss })),
                        borderColor: isDarkMode ? '#b967ff' : '#ff9f40',  // Changed to vivid purple
                        tension: 0.1
                    },
                    {
                        label: 'Hangboard CTSS',
                        data: hangboard.map(i => ({ x: i.date, y: i.total_ctss })),
                        borderColor: isDarkMode ? '#ffd700' : '#9966ff',  // Changed to gold
                        tension: 0.1
                    },
                    {
                        label: 'Chronic Load (CTL)',
                        data: trainingLoad.map(i => ({ x: i.date, y: i.ctl })),
                        borderColor: isDarkMode ? '#50fa7b' : '#ff6384',  // Keep cyber green
                        tension: 0.1
                    },
                    {
                        label: 'Acute Load (ATL)',
                        data: trainingLoad.map(i => ({ x: i.date, y: i.atl })),
                        borderColor: isDarkMode ? '#00f9ff' : '#36a2eb',  // Brighter cyan
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: isDarkMode ? '#fffffe' : '#333333'
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'MMM d, yyyy'
                        },
                        grid: {
                            color: isDarkMode ? '#4e4e5e' : '#e0e0e0'
                        },
                        ticks: {
                            color: isDarkMode ? '#fffffe' : '#333333'
                        }
                    },
                    y: {
                        grid: {
                            color: isDarkMode ? '#4e4e5e' : '#e0e0e0'
                        },
                        ticks: {
                            color: isDarkMode ? '#fffffe' : '#333333'
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating chart:', error);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.title.includes('CTSS Calculator')) return;
    
    try {
        const load = await fetchTrainingLoad();
        if (load) displayTrainingLoad(load);
        createCtlChart();
        
        // Refresh data every 5 minutes
        setInterval(updateDisplay, 300000);
    } catch (error) {
        console.error('Initialization error:', error);
    }
});
