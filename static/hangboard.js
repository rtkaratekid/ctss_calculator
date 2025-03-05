/********************************/
/* Hangboard Session Functions */
/********************************/

let hangboardHangs = [];
let sessionDuration = 0; // in minutes

function addHangboard() {
    const grip = document.getElementById('hangboard-grip').value;
    const relIntensity = parseFloat(document.getElementById('hangboard-rel-intensity').value);
    const tutPerHang = parseFloat(document.getElementById('hangboard-tut').value);
    // const weight = parseInt(document.getElementById('hangboard-weight').value)
    const reps = parseInt(document.getElementById('hangboard-reps').value);
    const sessionDuration = parseInt(document.getElementById('session-duration').value);

    if (!isNaN(reps) && !isNaN(weight)) {
        const tutPerSet = (tutPerHang / 60) * reps; // Convert seconds to minutes
        const hang = { grip, relIntensity, reps, tutPerHang, tutPerSet };
        hang.ctss = calculateHangboardCTSS(hang);
        hangboardHangs.push(hang);

        const newRow = document.createElement('tr');
        newRow.style.animation = 'slideIn 0.5s ease-out';
        newRow.innerHTML = `
            <td>${hangboardHangs.length}</td>
            <td>${grip}</td>
            <td>${relIntensity}%</td>
            <td>${tutPerSet}</td>
            <td>${hang.ctss.toFixed(2)}</td>
        `;
        document.getElementById('added-hangboard').append(newRow);

        let sessionCtss = calculateHangboardSessionCTSS();
        document.getElementById('hangboard-score').textContent = sessionCtss.toFixed(2);
    }
}

function calculateHangboardCtssSet(hang) {
    return Math.pow(hang.relIntensity, 2) * hang.tutPerSet;
}

function calculateHangboardSessionCTSS() {
    let scalingFactor = 2.5;
    let volume = hangboardHangs.reduce((sum, hang) => sum + hang.ctss, 0);
    let totalTutSeconds = hangboardHangs.reduce((sum, hang) => sum + (hang.reps * hang.length), 0);
    let totalTutMinutes = totalTutSeconds / 60;
    let density = totalTutMinutes / sessionDuration;
    let hCss = volume * density * scalingFactor;
    return Math.round(hCss);
}

function clearHangboard() {
    hangboardHangs = [];
    document.getElementById('added-hangboard').innerHTML = '';
    document.getElementById('hangboard-score').textContent = '0';
}

function undoHangboard() {
    if (hangboardHangs.length > 0) {
        hangboardHangs.pop(); // Remove the last hang from the array
        updateHangboardTable(); // Update the table display
        calculateHangboardSessionCTSS(); // Recalculate the session CTSS
    } else {
        alert("No hangs to undo!");
    }
}

function updateHangboardTable() {
    const tableBody = document.getElementById('added-hangboard');
    tableBody.innerHTML = ''; // Clear the current table
    hangboardHangs.forEach((hang, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>${hang.grip}</td>
            <td>${hang.weight}</td>
            <td>${hang.reps}</td>
            <td>${hang.ctss}</td>
        `;
        tableBody.appendChild(newRow);
    });
}


function submitHangboardSession() {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sessionData = {
        type: 'hangboard',
        date: currentDate,
        totalCTSS: calculateHangboardSessionCTSS(),
        hangs: hangboardHangs
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
        alert('Session submitted successfully!');
        fetchHistoricalData('hangboard'); // Fetch updated data after submission
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error submitting session. Please try again.');
    });

    calculateTrainingLoad();
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
    fetchHistoricalData('bouldering');
});