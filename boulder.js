/********************************/
/* Bouldering Session Functions */
/********************************/

let boulders = [];

function addBoulder() {
    const grade = parseInt(document.getElementById('boulder-grade').value);
    const attempts = parseInt(document.getElementById('boulder-attempts').value);

    if (!isNaN(grade) && !isNaN(attempts)) {
        const boulder = { grade, attempts };
        boulder.ctss = calculateBoulderCTSS(boulder);
        boulders.push(boulder);

        const newRow = document.createElement('tr');
        newRow.style.animation = 'slideIn 0.5s ease-out';
        newRow.innerHTML = `
            <td>${boulders.length}</td>
            <td>V${grade}</td>
            <td>${attempts}</td>
            <td>${boulder.ctss}</td>
        `;
        document.getElementById('added-boulders').append(newRow);

        let sessionCtss = calculateBoulderSessionCTSS();
        document.getElementById('bouldering-score').textContent = sessionCtss;
    }
}

function calculateBoulderCTSS(boulder) {
    return (boulder.grade + 1) * boulder.attempts;
}

function calculateBoulderSessionCTSS() {
    return boulders.reduce((sum, boulder) => sum + boulder.ctss, 0);
}

function clearBoulders() {
    boulders = [];
    document.getElementById('added-boulders').innerHTML = '';
    document.getElementById('bouldering-score').textContent = '0';
}

function undoBoulder() {
    if (boulders.length > 0) {
        boulders.pop(); // Remove the last boulder from the array
        updateBoulderTable(); // Update the table display
        calculateBoulderSessionCTSS(); // Recalculate the session CTSS
    } else {
        alert("No boulders to undo!");
    }
}

function updateBoulderTable() {
    const tableBody = document.getElementById('added-boulders');
    tableBody.innerHTML = ''; // Clear the current table
    boulders.forEach((boulder, index) => {

        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>V${boulder.grade}</td>
            <td>${boulder.attempts}</td>
            <td>${boulder.ctss}</td>
        `;
        tableBody.appendChild(newRow);
    });
}

function submitBoulderingSession() {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sessionData = {
        type: 'bouldering',
        date: currentDate,
        totalCTSS: Number(calculateBoulderSessionCTSS()),
        boulders: boulders
    };

    console.log('Sending session data:', sessionData);

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
        alert('Bouldering session submitted successfully!');
        fetchHistoricalData('bouldering'); // Fetch updated data after submission
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error submitting bouldering session. Please try again.');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    fetchHistoricalData('bouldering');
});

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

