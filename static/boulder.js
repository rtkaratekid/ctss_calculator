let boulders = [];
let chart = null;

// Add UTC date helper function at the top
function getUTCDateString(date = new Date()) {
    return date.toISOString().split('T')[0];
}

function initializeChart() {
    const ctx = document.getElementById('ctssChart').getContext('2d');
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
