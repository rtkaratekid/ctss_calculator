/********************************/
/* Hangboard Session Functions */
/********************************/

let hangboardHangs = [];

function addHangboard() {
    const grip = document.getElementById('hangboard-grip').value;
    const weight = parseInt(document.getElementById('hangboard-weight').value)
    const reps = parseInt(document.getElementById('hangboard-reps').value);

    if (!isNaN(reps) && !isNaN(weight)) {
        const hang = { grip, weight, reps };
        hang.ctss = calculateHangboardCTSS(hang);
        hangboardHangs.push(hang);

        const newRow = document.createElement('tr');
        newRow.style.animation = 'slideIn 0.5s ease-out';
        newRow.innerHTML = `
            <td>${hangboardHangs.length}</td>
            <td>${grip}</td>
            <td>${weight}</td>
            <td>${reps}</td>
            <td>${hang.ctss}</td>
        `;
        document.getElementById('added-hangboard').append(newRow);

        let sessionCtss = calculateHangboardSessionCTSS();
        document.getElementById('hangboard-score').textContent = sessionCtss;
    }
}

function calculateHangboardCTSS(hang) {
    return Math.round((hang.weight * 0.9) * (hang.reps * 0.1));
}

function calculateHangboardSessionCTSS() {
    return hangboardHangs.reduce((sum, hang) => sum + hang.ctss, 0);
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

    // TODO make this endpoint
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