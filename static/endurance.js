/********************************/
/* Endurance Session Functions */
/********************************/

let enduranceRoutes = [];
let maxGrade = 0;
let sessionDuration = 0; // minutes

function addEndurance() {
    const gradeValue = parseInt(document.getElementById('endurance-grade').value);
    const duration = parseInt(document.getElementById('endurance-duration').value);
    maxGrade = parseInt(document.getElementById('max-endurance-grade').value);
    sessionDuration = parseInt(document.getElementById('session-duration').value);

    if (!isNaN(gradeValue) && !isNaN(duration)) {
        const route = { gradeValue, duration };
        route.ctss = calculateEnduranceCTSS(route);
        enduranceRoutes.push(route);

        const newRow = document.createElement('tr');
        newRow.style.animation = 'slideIn 0.5s ease-out';
        newRow.innerHTML = `
            <td>${enduranceRoutes.length}</td>
            <td>${getYDSGrade(gradeValue)}</td>
            <td>${duration}</td>
            <td>${route.ctss}</td>
        `;
        document.getElementById('added-endurance').append(newRow);

        let sessionCtss = calculateEnduranceSessionCTSS();
        document.getElementById('endurance-score').textContent = sessionCtss;
    }
}

function calculateEnduranceCTSS(route) {
    return Math.pow((route.gradeValue) / (maxGrade), 2) * route.duration;
}

function calculateEnduranceSessionCTSS() {
    let volume = enduranceRoutes.reduce((sum, route) => sum + route.ctss, 0);
    let totalDuration = enduranceRoutes.reduce((sum, route) => sum + route.duration, 0);
    let density = totalDuration / sessionDuration;
    return volume * density;
}

function clearEndurance() {
    enduranceRoutes = [];
    document.getElementById('added-endurance').innerHTML = '';
    document.getElementById('endurance-score').textContent = '0';
}

function undoEndurance() {
    if (enduranceRoutes.length > 0) {
        enduranceRoutes.pop(); // Remove the last route from the array
        updateEnduranceTable(); // Update the table display
        calculateEnduranceSessionCTSS(); // Recalculate the session CTSS
    } else {
        alert("No routes/circuits to undo!");
    }
}

function updateEnduranceTable() {
    const tableBody = document.getElementById('added-endurance');
    tableBody.innerHTML = ''; // Clear the current table
    enduranceRoutes.forEach((route, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>${getYDSGrade(route.gradeValue)}</td>
            <td>${route.duration}</td>
            <td>${route.ctss}</td>
        `;
        tableBody.appendChild(newRow);
    });
}

function submitEnduranceSession() {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sessionData = {
        type: 'endurance',
        date: currentDate,
        totalCTSS: calculateEnduranceSessionCTSS(),
        routes: enduranceRoutes
    };

    fetch('/api/submit-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Endurance session submitted successfully!');
        fetchHistoricalData('endurance');
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error submitting endurance session. Please try again.');
    });

    calculateTrainingLoad();
}

function getYDSGrade(value) {
    const grades = {
        6: "5.10-", 7: "5.10+", 8: "5.11-", 9: "5.11+", 10: "5.12-",
        11: "5.12+", 12: "5.13-", 13: "5.13+", 14: "5.14-", 15: "5.14+"
    };
    return grades[value] || "Unknown";
}

function fetchHistoricalData(sessionType) {
    fetch(`/api/historical-data/${sessionType}`)
        .then(response => response.json())
        .then(data => createChart(data))
        .catch(error => console.error('Error fetching historical data:', error));
}

function createChart(data) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const ctx = document.getElementById('ctssChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(item => item.date),
            datasets: [{
                label: 'CTSS Score',
                data: data.map(item => item.totalCTSS),
                borderColor: isDarkMode ? '#ff6ad5' : 'rgb(75, 192, 192)', // Synthy pink in dark mode
                backgroundColor: isDarkMode ? 'rgba(255, 106, 213, 0.1)' : 'rgba(75, 192, 192, 0.1)',
                tension: 0.1
            }]
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
}

document.addEventListener('DOMContentLoaded', function() {
    fetchHistoricalData('endurance');
});