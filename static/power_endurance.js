let powerEnduranceRoutes = [];
let powerEnduranceChart = null;

function initializePowerEnduranceChart() {
    const ctx = document.getElementById('powerEnduranceChart').getContext('2d');
    powerEnduranceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Power Endurance CTSS History',
                data: [],
                borderColor: '#FF5722',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    updatePowerEnduranceChart();
}

async function updatePowerEnduranceChart() {
    try {
        const response = await fetch('/api/historical-data/power_endurance');
        const data = await response.json();
        
        powerEnduranceChart.data.labels = data.map(item => item.date);
        powerEnduranceChart.data.datasets[0].data = data.map(item => item.total_ctss);
        powerEnduranceChart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

function addPowerEndurance() {
    const gradeSelect = document.getElementById('power-endurance-grade');
    const routeDurationInput = document.getElementById('route-duration');
    
    if (!gradeSelect.value || !routeDurationInput.value) {
        alert('Please select a grade and enter route duration');
        return;
    }

    const gradeValue = parseInt(gradeSelect.value);
    const routeDuration = parseInt(routeDurationInput.value) || 0;
    
    powerEnduranceRoutes.push({ 
        gradeValue,
        routeDuration
    });
    
    const tableBody = document.getElementById('added-power-endurance');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${powerEnduranceRoutes.length}</td>
        <td>${getYDSGrade(gradeValue)}</td>
        <td>${routeDuration}</td>
        <td class="ctss-cell">Calculating...</td>
    `;

    tableBody.appendChild(newRow);
}

async function submitPowerEnduranceSession() {
    const maxGrade = document.getElementById('max-power-endurance-grade').value;
    const durationMinutes = document.getElementById('session-duration').value;
    const sessionDate = document.getElementById('session-date').value || new Date().toISOString().split('T')[0];

    if (!maxGrade || !durationMinutes || powerEnduranceRoutes.length === 0) {
        alert('Please fill all required fields and add at least one route');
        return;
    }

    try {
        const routes = powerEnduranceRoutes.map(route => ({
            grade: route.gradeValue,
            duration: route.routeDuration,
        }));

        const sessionData = {
            type: 'power_endurance',
            date: sessionDate,
            max_grade: parseInt(maxGrade),
            routes: routes,
            duration_hours: parseFloat(durationMinutes) / 60
        };

        const response = await fetch('/api/submit-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData)
        });

        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('power-endurance-score').textContent = result.total_ctss.toFixed(1);
            
            // document.querySelectorAll('.ctss-cell').forEach((cell, index) => {
            //     const grade = powerEnduranceRoutes[index].gradeValue;
            //     const gradeScore = (grade / maxGrade) ** 3.5 * reps;
            //     cell.textContent = gradeScore.toFixed(1);
            // });

            alert('Session saved successfully!');
            powerEnduranceRoutes = [];
            document.getElementById('power-endurance-grade').value = '';
            
            await updatePowerEnduranceChart();
            loadTrainingData();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error submitting session:', error);
        alert('Failed to save session. Please try again.');
    }
}

function undoPowerEndurance() {
    if (powerEnduranceRoutes.length > 0) {
        powerEnduranceRoutes.pop();
        const tableBody = document.getElementById('added-power-endurance');
        tableBody.removeChild(tableBody.lastElementChild);
    }
}

function clearPowerEndurance() {
    powerEnduranceRoutes = [];
    document.getElementById('added-power-endurance').innerHTML = '';
    document.getElementById('power-endurance-score').textContent = '0';
}

function getYDSGrade(value) {
    const grades = {
        6: "5.10-", 7: "5.10+", 8: "5.11-", 9: "5.11+", 10: "5.12-",
        11: "5.12+", 12: "5.13-", 13: "5.13+", 14: "5.14-", 15: "5.14+"
    };
    return grades[value] || "Unknown";
}

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('session-date');
    if (!dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    initializePowerEnduranceChart();
    loadTrainingData();
});

async function loadTrainingData() {
    try {
        const response = await fetch('/api/daily-stress');
        const data = await response.json();
        
        if (data.ctl !== undefined) {
            console.log('Current training load:', data);
        }
    } catch (error) {
        console.error('Error loading training data:', error);
    }
}