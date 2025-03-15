let hangboardSets = [];
let chart = null;

// Initialize Chart
function initializeChart() {
    const ctx = document.getElementById('ctssChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Hangboard CTSS History',
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
    updateChart();
}

// Update chart with server data
async function updateChart() {
    try {
        const response = await fetch('/api/historical-data/hangboard');
        const data = await response.json();
        
        chart.data.labels = data.map(item => item.date);
        chart.data.datasets[0].data = data.map(item => item.total_ctss);
        chart.update();
    } catch (error) {
        console.error('Error updating chart:', error);
    }
}

function addHangboard() {
    const grip = document.getElementById('hangboard-grip').value;
    const intensity = parseFloat(document.getElementById('hangboard-intensity').value);
    const reps = parseInt(document.getElementById('hangboard-reps').value);
    const seconds = parseInt(document.getElementById('hangboard-seconds').value);

    if (!grip || isNaN(intensity) || isNaN(reps) || isNaN(seconds)) {
        alert('Please fill all required fields');
        return;
    }

    // Add to local array
    hangboardSets.push({
        grip,
        intensity: intensity / 100, // Convert percentage to decimal
        reps,
        secondsPerRep: seconds
    });

    // Update UI table
    const tableBody = document.getElementById('added-hangboard');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${hangboardSets.length}</td>
        <td>${grip}</td>
        <td>${intensity}%</td>
        <td>${reps}x${seconds}s</td>
        <td class="ctss-cell">Calculating...</td>
    `;

    tableBody.appendChild(newRow);
}

async function submitHangboardSession() {
    const sessionDate = document.getElementById('session-date').value || new Date().toISOString().split('T')[0];
    const durationMinutes = document.getElementById('session-duration').value;

    if (!durationMinutes || hangboardSets.length === 0) {
        alert('Please fill session duration and add at least one set');
        return;
    }

    try {
        const sessionData = {
            type: 'hangboard',
            date: sessionDate,
            sets: hangboardSets.map(set => ({
                grip: set.grip,
                intensity: set.intensity,
                reps: set.reps,
                secondsPerRep: set.secondsPerRep
            })),
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
            // Update UI with server-calculated values
            document.getElementById('hangboard-score').textContent = result.total_ctss.toFixed(1);
            
            // Update CTSS cells in table
            document.querySelectorAll('.ctss-cell').forEach((cell, index) => {
                const set = hangboardSets[index];
                const setScore = (set.intensity ** 2) * 
                              (set.reps * set.secondsPerRep / 60); // TUT in minutes
                cell.textContent = setScore.toFixed(1);
            });

            alert('Session saved successfully!');
            hangboardSets = [];
            document.getElementById('hangboard-grip').value = '';
            document.getElementById('hangboard-intensity').value = '';
            document.getElementById('hangboard-reps').value = '';
            document.getElementById('hangboard-seconds').value = '';


            await updateChart();
            loadTrainingData();
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error submitting session:', error);
        alert('Failed to save session. Please try again.');
    }
}

// Existing utility functions
function undoHangboard() {
    if (hangboardSets.length > 0) {
        hangboardSets.pop();
        const tableBody = document.getElementById('added-hangboard');
        tableBody.removeChild(tableBody.lastElementChild);
    }
}

function clearHangboard() {
    hangboardSets = [];
    document.getElementById('added-hangboard').innerHTML = '';
    document.getElementById('hangboard-score').textContent = '0';
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize date picker with today's date
    const dateInput = document.getElementById('session-date');
    if (!dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
    
    initializeChart();
    loadTrainingData();
});

// Load training load data
async function loadTrainingData() {
    try {
        const response = await fetch('/api/daily-stress');
        const data = await response.json();
        
        if (data.ctl !== undefined) {
            // Update your training load display here
            console.log('Current training load:', data);
        }
    } catch (error) {
        console.error('Error loading training data:', error);
    }
}
// /********************************/
// /* Hangboard Session Functions */
// /********************************/

// let hangboardSets = [];
// let sessionDuration = 0; // in hours

// function addHangboard() {
//     const grip = document.getElementById('hangboard-grip').value;
//     const relIntensityPercent = parseFloat(document.getElementById('hangboard-rel-intensity').value);
//     const tutPerHang = parseFloat(document.getElementById('hangboard-tut').value);
//     // const weight = parseInt(document.getElementById('hangboard-weight').value)
//     const reps = parseInt(document.getElementById('hangboard-reps').value);
//     const sessionDurationMinutes = parseInt(document.getElementById('session-duration').value);
//     sessionDuration = sessionDurationMinutes / 60; // Convert minutes to hours

//     if (!isNaN(reps)) {
//         const tut = (tutPerHang / 60) * reps; // Convert seconds to minutes
//         const relIntensity = relIntensityPercent / 100; // Convert percentage to decimal
//         const set = { grip, relIntensity, reps, tutPerHang, tut };
//         set.ctss = calculateHangboardCtssSet(set);

//         hangboardSets.push(set);

//         const newRow = document.createElement('tr');
//         newRow.style.animation = 'slideIn 0.5s ease-out';
//         newRow.innerHTML = `
//             <td>${hangboardSets.length}</td>
//             <td>${grip}</td>
//             <td>${relIntensity * 10}%</td>
//             <td>${tutPerHang}</td>
//             <td>${set.ctss.toFixed(2)}</td>
//         `;
//         document.getElementById('added-hangboard').append(newRow);

//         let sessionCtss = calculateHangboardSessionCTSS();
//         document.getElementById('hangboard-score').textContent = sessionCtss;
//     }
// }

// function calculateHangboardCtssSet(hang) {
//     const setTut = hang.reps * hang.tutPerHang / 60;
//     console.log(setTut);
//     const loadPerSet = Math.pow(hang.relIntensity, 2) * setTut;
//     console.log(loadPerSet);
//     return loadPerSet;
// }

// function calculateHangboardSessionCTSS() {
//     let scalingFactor = 1;
//     const sessionLoad = hangboardSets.reduce((sum, set) => sum + set.ctss, 0);
//     console.log(sessionLoad);
//     const sessionTut = hangboardSets.reduce((sum, set) => sum + set.tut, 0); // in minutes
//     console.log(sessionTut);
//     const sessionDensity = sessionTut / sessionDuration;
//     console.log(sessionDensity);

//     const Hss = sessionLoad * sessionDensity * scalingFactor;
//     return Math.round(Hss * 100) / 100;

//     // let volume = hangboardSets.reduce((sum, hang) => sum + hang.ctss, 0);
//     // console.log(volume);
//     // let totalTutSeconds = hangboardSets.reduce((sum, hang) => sum + (hang.reps * hang.tutPerHang), 0);
//     // console.log(totalTutSeconds);
//     // let totalTutMinutes = totalTutSeconds / 60;
//     // console.log(totalTutMinutes);
//     // let density = totalTutMinutes / sessionDuration;
//     // console.log(density);
//     // let hCss = volume * density * scalingFactor;
//     // console.log(hCss);
//     // return Math.round(hCss);
// }

// function clearHangboard() {
//     hangboardSets = [];
//     document.getElementById('added-hangboard').innerHTML = '';
//     document.getElementById('hangboard-score').textContent = '0';
// }

// function undoHangboard() {
//     if (hangboardSets.length > 0) {
//         hangboardSets.pop(); // Remove the last hang from the array
//         updateHangboardTable(); // Update the table display
//         calculateHangboardSessionCTSS(); // Recalculate the session CTSS
//     } else {
//         alert("No hangs to undo!");
//     }
// }

// function updateHangboardTable() {
//     const tableBody = document.getElementById('added-hangboard');
//     tableBody.innerHTML = ''; // Clear the current table
//     hangboardSets.forEach((hang, index) => {
//         const newRow = document.createElement('tr');
//         newRow.innerHTML = `
//             <td>${index + 1}</td>
//             <td>${hang.grip}</td>
//             <td>${hang.relIntensity}</td>
//             <td>${hang.reps}</td>
//             <td>${hang.ctss}</td>
//         `;
//         tableBody.appendChild(newRow);
//     });
// }


// function submitHangboardSession() {
//     const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
//     const sessionData = {
//         type: 'hangboard',
//         date: currentDate,
//         totalCTSS: calculateHangboardSessionCTSS(),
//         hangs: hangboardSets
//     };

//     fetch('/api/submit-session', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(sessionData)
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log('Success:', data);
//         alert('Session submitted successfully!');
//         fetchHistoricalData('hangboard'); // Fetch updated data after submission
//     })
//     .catch((error) => {
//         console.error('Error:', error);
//         alert('Error submitting session. Please try again.');
//     });

//     calculateTrainingLoad();
// }


// function fetchHistoricalData(sessionType) {
//     fetch(`/api/historical-data/${sessionType}`)
//         .then(response => response.json())
//         .then(data => createChart(data))
//         .catch(error => console.error('Error fetching historical data:', error));
// }

// function createChart(data) {
//     const isDarkMode = document.body.classList.contains('dark-mode');
//     const ctx = document.getElementById('ctssChart').getContext('2d');
//     new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: data.map(item => item.date),
//             datasets: [{
//                 label: 'CTSS Score',
//                 data: data.map(item => item.totalCTSS),
//                 borderColor: isDarkMode ? '#ff6ad5' : 'rgb(75, 192, 192)', // Synthy pink in dark mode
//                 backgroundColor: isDarkMode ? 'rgba(255, 106, 213, 0.1)' : 'rgba(75, 192, 192, 0.1)',
//                 tension: 0.1
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 legend: {
//                     labels: {
//                         color: isDarkMode ? '#fffffe' : '#333333'
//                     }
//                 }
//             },
//             scales: {
//                 x: {
//                     grid: {
//                         color: isDarkMode ? '#4e4e5e' : '#e0e0e0'
//                     },
//                     ticks: {
//                         color: isDarkMode ? '#fffffe' : '#333333'
//                     }
//                 },
//                 y: {
//                     grid: {
//                         color: isDarkMode ? '#4e4e5e' : '#e0e0e0'
//                     },
//                     ticks: {
//                         color: isDarkMode ? '#fffffe' : '#333333'
//                     }
//                 }
//             }
//         }
//     });
// }

// document.addEventListener('DOMContentLoaded', function() {
//     fetchHistoricalData('hangboard');
// });