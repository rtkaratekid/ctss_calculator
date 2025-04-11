let boulders = [];
let chart = null;
let volumeChart = null;

// Add UTC date helper function at the top
function getUTCDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
}

function initializeChart() {
    const ctx = document.getElementById('ctssChart').getContext('2d');
    const volumeCtx = document.getElementById('boulderingVolumesChart').getContext('2d');
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    // Theme-adaptive colors
    const themeColors = {
        text: isDarkMode ? '#fffffe' : '#2c3e50',
        grid: isDarkMode ? '#4e4e5e' : '#e0e0e0',
        background: isDarkMode ? '#1e1e2e' : '#ffffff',
        line: isDarkMode ? '#ff6ad5' : '#3498db'
    };

    // Destroy existing chart if it exists
    if (chart) chart.destroy();
    if (volumeChart) volumeChart.destroy();
    
    const percentagePlugin = {
        id: 'percentagePlugin',
        afterDatasetsDraw(chart) {
            const { ctx, data, chartArea: { top } } = chart;
            ctx.save();
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = chart.options.plugins.legend.labels.color;
    
            const totalAttempts = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    
            data.datasets[0].data.forEach((value, index) => {
                const percentage = ((value / totalAttempts) * 100).toFixed(0) + '%';
                const bar = chart.getDatasetMeta(0).data[index];
                const x = bar.x;
                const y = bar.y - 10; // Position above the bar
                ctx.fillText(percentage, x, y);
            });
    
            ctx.restore();
        }
    };
    
    volumeChart = new Chart(volumeCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Volume',
                data: [],
                backgroundColor: themeColors.line,
                borderColor: themeColors.line,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: themeColors.text,
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: themeColors.background,
                    titleColor: themeColors.text,
                    bodyColor: themeColors.text,
                    borderColor: themeColors.grid,
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: themeColors.grid,
                        borderColor: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text,
                        font: {
                            weight: '500'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Number of Attempts',
                        color: themeColors.text,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    type: 'category',
                    grid: {
                        color: themeColors.grid,
                        borderColor: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text,
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            weight: '500'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Problem Grade',
                        color: themeColors.text,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        },
        plugins: [percentagePlugin]
    });
    updateVolumeChart();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Bouldering CTSS',
                data: [],
                borderColor: themeColors.line,
                backgroundColor: isDarkMode 
                    ? chroma(themeColors.line).alpha(0.1).css()
                    : chroma(themeColors.line).alpha(0.1).css(),
                tension: 0.1,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: themeColors.text,
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: themeColors.background,
                    titleColor: themeColors.text,
                    bodyColor: themeColors.text,
                    borderColor: themeColors.grid,
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: themeColors.grid,
                        borderColor: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text,
                        font: {
                            weight: '500'
                        }
                    },
                    title: {
                        display: true,
                        text: 'CTSS',
                        color: themeColors.text,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    type: 'time',
                    time: {
                        parser: 'yyyy-MM-dd',
                        unit: 'day',
                        tooltipFormat: 'MMM d, yyyy',
                        displayFormats: {
                            day: 'MMM d'
                        }
                    },
                    grid: {
                        color: themeColors.grid,
                        borderColor: themeColors.grid
                    },
                    ticks: {
                        color: themeColors.text,
                        maxRotation: 45,
                        minRotation: 45,
                        font: {
                            weight: '500'
                        }
                    }
                }
            }
        }
    });
    updateChart();
}

async function updateChart() {
    try {
        const response = await fetch('/api/historical-data/bouldering');
        const data = await response.json();
        
        // Convert dates to JavaScript Date objects
        chart.data.labels = data.map(item => {
            // If your dates are in string format, parse them
            const dateParts = item.date.split('-');
            return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        });
        
        chart.data.datasets[0].data = data.map(item => item.total_ctss);
        chart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

async function updateVolumeChart() {
    try {
        const response = await fetch('/api/session-history/bouldering');
        const data = await response.json();

        // Gather the number of problems done at each grade
        const gradeCounts = {};
        data.forEach(item => {
            const parsedData = JSON.parse(item.data);
            if (parsedData.attempts) {
                for (const [grade, attempts] of Object.entries(parsedData.attempts)) {
                    gradeCounts[grade] = (gradeCounts[grade] || 0) + attempts;
                }
            }
        });

        // Prepare data for the chart
        const labels = Object.keys(gradeCounts).map(grade => `V${grade}`);
        const dataPoints = Object.values(gradeCounts);

        // Define color palettes for light and dark modes
        const lightModeColors = {
            V0: '#3498db',  // Light Blue
            V1: '#2ecc71',  // Green
            V2: '#e74c3c',  // Red
            V3: '#9b59b6',  // Purple
            V4: '#f1c40f',  // Yellow
            V5: '#e67e22',  // Orange
            V6: '#1abc9c',  // Teal
            V7: '#34495e',  // Dark Blue
            V8: '#8e44ad',  // Dark Purple
            V9: '#c0392b',  // Dark Red
            V10: '#d35400', // Dark Orange
            V11: '#27ae60', // Dark Green
            V12: '#2980b9', // Medium Blue
            V13: '#f39c12', // Gold
            V14: '#16a085', // Aqua
            V15: '#2c3e50'  // Navy
        };

        const darkModeColors = {
            V0: '#5dade2',  // Lighter Blue
            V1: '#58d68d',  // Lighter Green
            V2: '#f1948a',  // Lighter Red
            V3: '#af7ac5',  // Lighter Purple
            V4: '#f9e79f',  // Lighter Yellow
            V5: '#f5b041',  // Lighter Orange
            V6: '#76d7c4',  // Lighter Teal
            V7: '#566573',  // Lighter Dark Blue
            V8: '#bb8fce',  // Lighter Dark Purple
            V9: '#e6b0aa',  // Lighter Dark Red
            V10: '#e59866', // Lighter Dark Orange
            V11: '#82e0aa', // Lighter Dark Green
            V12: '#85c1e9', // Lighter Medium Blue
            V13: '#f8c471', // Lighter Gold
            V14: '#48c9b0', // Lighter Aqua
            V15: '#85929e'  // Lighter Navy
        };

        // Determine the current mode
        const isDarkMode = document.body.classList.contains('dark-mode');
        const gradeColors = isDarkMode ? darkModeColors : lightModeColors;

        // Map colors to grades
        const colors = labels.map(label => gradeColors[label] || '#bdc3c7'); // Default to gray if grade not found

        volumeChart.data.labels = labels;
        volumeChart.data.datasets[0].data = dataPoints;
        volumeChart.data.datasets[0].backgroundColor = colors;
        volumeChart.update();
    } catch (error) {
        console.error('Error updating volume chart:', error);
    }
}

function addBoulder() {
    const gradeSelect = document.getElementById('boulder-grade');
    const attemptsInput = document.getElementById('boulder-attempts');
    
    if (!gradeSelect.value || !attemptsInput.value) {
        alert('Please select a grade and enter number of attempts');
        return;
    }

    const grade = parseInt(gradeSelect.value);
    const attempts = parseInt(attemptsInput.value);
    
    // Add to local array
    boulders.push({ grade, attempts });
    
    // Update UI table
    const tableBody = document.getElementById('added-boulders');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${boulders.length}</td>
        <td>V${grade}</td>
        <td>${attempts}</td>
        <td class="ctss-cell">Calculating...</td>
    `;

    tableBody.appendChild(newRow);
    
}

async function submitBoulderingSession() {
    const maxGrade = document.getElementById('max-boulder-grade').value;
    const durationMinutes = document.getElementById('session-duration').value;
    // const sessionDate = document.getElementById('session-date').value || new Date().toISOString().split('T')[0];
    const sessionDate = document.getElementById('session-date').value || getUTCDateString(); // Use UTC helper

    
    if (!maxGrade || !durationMinutes || boulders.length === 0) {
        alert('Please fill all required fields and add at least one boulder');
        return;
    }

    try {
        // Aggregate attempts by grade
        const attempts = {};
        boulders.forEach(b => {
            attempts[b.grade] = (attempts[b.grade] || 0) + b.attempts;
        });

        const sessionData = {
            type: 'bouldering',
            max_grade: parseInt(maxGrade),
            attempts: attempts,
            duration_hours: parseFloat(durationMinutes) / 60,
            date: sessionDate
        };

        console.log('Submitting with UTC date:', sessionDate);

        const response = await fetch('/api/submit-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData)
        });

        const result = await response.json();
        
        if (response.ok) {
            // Update UI with calculated values
            document.getElementById('bouldering-score').textContent = result.total_ctss.toFixed(1);
            
            // Update CTSS cells in table
            document.querySelectorAll('.ctss-cell').forEach((cell, index) => {
                const grade = boulders[index].grade;
                const gradeScore = ((grade + 1) / (maxGrade + 1)) ** 2 * boulders[index].attempts;
                cell.textContent = gradeScore.toFixed(1);
            });

            // Clear form
            boulders = [];
            document.getElementById('max-boulder-grade').value = '';
            document.getElementById('session-duration').value = '';
            document.getElementById('boulder-grade').value = '';
            document.getElementById('boulder-attempts').value = '';
            
            // Update chart
            await updateChart();
            
            // Update training load display
            loadTrainingData();
            
            alert('Session saved successfully!');
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error submitting session:', error);
        alert('Failed to save session. Please try again.');
    }
}

// Existing utility functions
function undoBoulder() {
    if (boulders.length > 0) {
        boulders.pop();
        const tableBody = document.getElementById('added-boulders');
        tableBody.removeChild(tableBody.lastElementChild);
    }
}

function clearBoulders() {
    boulders = [];
    document.getElementById('added-boulders').innerHTML = '';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('session-date');
    if (!dateInput.value) {
        dateInput.value = getUTCDateString(); // Set to UTC date instead of local
    }
    initializeChart();
    loadTrainingData();
});

// Update the loadTrainingData function to use UTC
async function loadTrainingData() {
    try {
        const response = await fetch(`/api/daily-stress?date=${getUTCDateString()}`);
        const data = await response.json();
        
        if (data.ctl !== undefined) {
            console.log('UTC Training Load:', data);
            // Update UI elements as needed
        }
    } catch (error) {
        console.error('Error loading training data:', error);
    }
}
