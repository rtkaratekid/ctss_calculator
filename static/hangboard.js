/********************************/
/* Hangboard Session Functions */
/********************************/

let hangboardSets = [];
let sessionDuration = 0; // in hours

function addHangboard() {
    const grip = document.getElementById('hangboard-grip').value;
    const relIntensityPercent = parseFloat(document.getElementById('hangboard-rel-intensity').value);
    const tutPerHang = parseFloat(document.getElementById('hangboard-tut').value);
    // const weight = parseInt(document.getElementById('hangboard-weight').value)
    const reps = parseInt(document.getElementById('hangboard-reps').value);
    const sessionDurationMinutes = parseInt(document.getElementById('session-duration').value);
    sessionDuration = sessionDurationMinutes / 60; // Convert minutes to hours

    if (!isNaN(reps)) {
        const tut = (tutPerHang / 60) * reps; // Convert seconds to minutes
        const relIntensity = relIntensityPercent / 100; // Convert percentage to decimal
        const set = { grip, relIntensity, reps, tutPerHang, tut };
        set.ctss = calculateHangboardCtssSet(set);

        hangboardSets.push(set);

        const newRow = document.createElement('tr');
        newRow.style.animation = 'slideIn 0.5s ease-out';
        newRow.innerHTML = `
            <td>${hangboardSets.length}</td>
            <td>${grip}</td>
            <td>${relIntensity * 10}%</td>
            <td>${tutPerHang}</td>
            <td>${set.ctss.toFixed(2)}</td>
        `;
        document.getElementById('added-hangboard').append(newRow);

        let sessionCtss = calculateHangboardSessionCTSS();
        document.getElementById('hangboard-score').textContent = sessionCtss;
    }
}

function calculateHangboardCtssSet(hang) {
    const setTut = hang.reps * hang.tutPerHang / 60;
    console.log(setTut);
    const loadPerSet = Math.pow(hang.relIntensity, 2) * setTut;
    console.log(loadPerSet);
    return loadPerSet;
}

function calculateHangboardSessionCTSS() {
    let scalingFactor = 1;
    const sessionLoad = hangboardSets.reduce((sum, set) => sum + set.ctss, 0);
    console.log(sessionLoad);
    const sessionTut = hangboardSets.reduce((sum, set) => sum + set.tut, 0); // in minutes
    console.log(sessionTut);
    const sessionDensity = sessionTut / sessionDuration;
    console.log(sessionDensity);

    const Hss = sessionLoad * sessionDensity * scalingFactor;
    return Math.round(Hss * 100) / 100;

    // let volume = hangboardSets.reduce((sum, hang) => sum + hang.ctss, 0);
    // console.log(volume);
    // let totalTutSeconds = hangboardSets.reduce((sum, hang) => sum + (hang.reps * hang.tutPerHang), 0);
    // console.log(totalTutSeconds);
    // let totalTutMinutes = totalTutSeconds / 60;
    // console.log(totalTutMinutes);
    // let density = totalTutMinutes / sessionDuration;
    // console.log(density);
    // let hCss = volume * density * scalingFactor;
    // console.log(hCss);
    // return Math.round(hCss);
}

function clearHangboard() {
    hangboardSets = [];
    document.getElementById('added-hangboard').innerHTML = '';
    document.getElementById('hangboard-score').textContent = '0';
}

function undoHangboard() {
    if (hangboardSets.length > 0) {
        hangboardSets.pop(); // Remove the last hang from the array
        updateHangboardTable(); // Update the table display
        calculateHangboardSessionCTSS(); // Recalculate the session CTSS
    } else {
        alert("No hangs to undo!");
    }
}

function updateHangboardTable() {
    const tableBody = document.getElementById('added-hangboard');
    tableBody.innerHTML = ''; // Clear the current table
    hangboardSets.forEach((hang, index) => {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${index + 1}</td>
            <td>${hang.grip}</td>
            <td>${hang.relIntensity}</td>
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
        hangs: hangboardSets
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
    fetchHistoricalData('hangboard');
});