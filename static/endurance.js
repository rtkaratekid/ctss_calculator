let enduranceRoutes = [];
let chart = null;
let gradeDurationChart = null;

// Initialize Chart
function initializeChart() {
    const ctx = document.getElementById('ctssChart').getContext('2d');
    const gradeDurationCtx = document.getElementById('gradeDurationChart').getContext('2d');
    const isDarkMode = document.body.classList.contains('dark-mode');

    // Theme-adaptive colors
    const themeColors = {
        text: isDarkMode ? '#fffffe' : '#2c3e50',
        grid: isDarkMode ? '#4e4e5e' : '#e0e0e0',
        background: isDarkMode ? '#1e1e2e' : '#ffffff',
        line: isDarkMode ? '#ff6ad5' : '#3498db'
    };


    // chart = new Chart(ctx, {
    //     type: 'line',
    //     data: {
    //         labels: [],
    //         datasets: [{
    //             label: 'Endurance CTSS History',
    //             data: [],
    //             borderColor: '#2196F3',
    //             tension: 0.1
    //         }]
    //     },
    //     options: {
    //         responsive: true,
    //         maintainAspectRatio: false,
    //         scales: {
    //             y: {
    //                 beginAtZero: true
    //             }
    //         }
    //     }
    // });
     // Destroy existing charts if they exist
     if (chart) chart.destroy();
     if (gradeDurationChart) gradeDurationChart.destroy();
 
     // Initialize CTSS History Chart
     chart = new Chart(ctx, {
         type: 'line',
         data: {
             labels: [],
             datasets: [{
                 label: 'Endurance CTSS History',
                 data: [],
                 borderColor: themeColors.line,
                 tension: 0.1
             }]
         },
         options: {
             responsive: true,
             maintainAspectRatio: false,
             scales: {
                 y: {
                     beginAtZero: true,
                     grid: {
                         color: themeColors.grid
                     },
                     ticks: {
                         color: themeColors.text
                     }
                 },
                 x: {
                     grid: {
                         color: themeColors.grid
                     },
                     ticks: {
                         color: themeColors.text
                     }
                 }
             }
         }
     });
 
     const percentagePlugin = {
        id: 'percentagePlugin',
        afterDatasetsDraw(chart) {
            const { ctx, data, chartArea: { top } } = chart;
            ctx.save();
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = chart.options.plugins.legend.labels.color;
    
            const totalDuration = data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    
            data.datasets[0].data.forEach((value, index) => {
                const percentage = ((value / totalDuration) * 100).toFixed(0) + '%';
                const bar = chart.getDatasetMeta(0).data[index];
                const x = bar.x;
                const y = bar.y - 10; // Position above the bar
                ctx.fillText(percentage, x, y);
            });
    
            ctx.restore();
        }
    };
 
     // Initialize Grade vs Duration Chart
     gradeDurationChart = new Chart(gradeDurationCtx, {
         type: 'bar',
         data: {
             labels: [],
             datasets: [{
                 label: 'Total Duration (minutes)',
                 data: [],
                 backgroundColor: [],
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
                         color: themeColors.grid
                     },
                     ticks: {
                         color: themeColors.text
                     },
                     title: {
                         display: true,
                         text: 'Total Duration (minutes)',
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
                         color: themeColors.grid
                     },
                     ticks: {
                         color: themeColors.text
                     },
                     title: {
                         display: true,
                         text: 'Grade',
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

    updateChart();
}

async function updateChart() {
    try {
        // Update CTSS History Chart
        const response = await fetch('/api/historical-data/endurance');
        const data = await response.json();

        chart.data.labels = data.map(item => item.date);
        chart.data.datasets[0].data = data.map(item => item.total_ctss);
        chart.update();

        // Update Grade vs Duration Chart
        const history_response = await fetch('/api/session-history/endurance');
        const history_data = await history_response.json();
        console.log(history_data);

        const gradeDurationCounts = {};
        history_data.forEach(item => {
            const parsedData = JSON.parse(item.data);
            parsedData.routes.forEach(route => {
                gradeDurationCounts[route.grade] = (gradeDurationCounts[route.grade] || 0) + route.time;
            });
        });

        const labels = Object.keys(gradeDurationCounts).map(grade => getYDSGrade(parseInt(grade)));
        const dataPoints = Object.values(gradeDurationCounts);

        // Define color palettes for light and dark modes
        const lightModeColors = {
            "5.10-": '#3498db', "5.10+": '#2ecc71', "5.11-": '#e74c3c', "5.11+": '#9b59b6',
            "5.12-": '#f1c40f', "5.12+": '#e67e22', "5.13-": '#1abc9c', "5.13+": '#34495e',
            "5.14-": '#8e44ad', "5.14+": '#c0392b'
        };

        const darkModeColors = {
            "5.10-": '#5dade2', "5.10+": '#58d68d', "5.11-": '#f1948a', "5.11+": '#af7ac5',
            "5.12-": '#f9e79f', "5.12+": '#f5b041', "5.13-": '#76d7c4', "5.13+": '#566573',
            "5.14-": '#bb8fce', "5.14+": '#e6b0aa'
        };

        // Determine the current mode
        const isDarkMode = document.body.classList.contains('dark-mode');
        const gradeColors = isDarkMode ? darkModeColors : lightModeColors;

        // Map colors to grades
        const colors = labels.map(label => gradeColors[label] || '#bdc3c7'); // Default to gray if grade not found

        gradeDurationChart.data.labels = labels;
        gradeDurationChart.data.datasets[0].data = dataPoints;
        gradeDurationChart.data.datasets[0].backgroundColor = colors;
        gradeDurationChart.update();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function addEndurance() {
    const gradeSelect = document.getElementById('endurance-grade');
    const durationInput = document.getElementById('endurance-duration');
    
    if (!gradeSelect.value || !durationInput.value) {
        alert('Please select a grade and enter duration');
        return;
    }

    const gradeValue = parseInt(gradeSelect.value);
    const durationMinutes = parseInt(durationInput.value);
    
    // Add to local array
    enduranceRoutes.push({ 
        gradeValue,
        duration: durationMinutes / 60 // Convert to hours
    });
    
    // Update UI table
    const tableBody = document.getElementById('added-endurance');
    const newRow = document.createElement('tr');
    
    newRow.innerHTML = `
        <td>${enduranceRoutes.length}</td>
        <td>${getYDSGrade(gradeValue)}</td>
        <td>${durationMinutes}</td>
        <td class="ctss-cell">Calculating...</td>
    `;

    tableBody.appendChild(newRow);
}

async function submitEnduranceSession() {
    const maxGrade = document.getElementById('max-endurance-grade').value;
    const durationMinutes = document.getElementById('session-duration').value;
    const sessionDate = document.getElementById('session-date').value || new Date().toISOString().split('T')[0];

    if (!maxGrade || !durationMinutes || enduranceRoutes.length === 0) {
        alert('Please fill all required fields and add at least one route');
        return;
    }

    try {
        // Format routes for server
        const routes = enduranceRoutes.map(route => ({
            grade: route.gradeValue,
            time: route.duration * 60 // Convert hours to minutes for server
        }));

        const sessionData = {
            type: 'endurance',
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
            // Update UI with calculated values
            document.getElementById('endurance-score').textContent = result.total_ctss.toFixed(1);
            
            // Update CTSS cells in table
            document.querySelectorAll('.ctss-cell').forEach((cell, index) => {
                const grade = enduranceRoutes[index].gradeValue;
                const gradeScore = (grade / maxGrade) ** 2 * enduranceRoutes[index].duration;
                cell.textContent = gradeScore.toFixed(1);
            });

            // Keep routes visible (don't clear table)
            alert('Session saved successfully!');
            enduranceRoutes = [];
            document.getElementById('endurance-grade').value = '';
            document.getElementById('endurance-duration').value = '';
            
            // Update chart and training load
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
function undoEndurance() {
    if (enduranceRoutes.length > 0) {
        enduranceRoutes.pop();
        const tableBody = document.getElementById('added-endurance');
        tableBody.removeChild(tableBody.lastElementChild);
    }
}

function clearEndurance() {
    enduranceRoutes = [];
    document.getElementById('added-endurance').innerHTML = '';
    document.getElementById('endurance-score').textContent = '0';
}

function getYDSGrade(value) {
    const grades = {
        6: "5.10-", 7: "5.10+", 8: "5.11-", 9: "5.11+", 10: "5.12-",
        11: "5.12+", 12: "5.13-", 13: "5.13+", 14: "5.14-", 15: "5.14+"
    };
    return grades[value] || "Unknown";
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
    // loadTrainingData();
});

// Load training load data
// async function loadTrainingData() {
//     try {
//         const response = await fetch('/api/daily-stress');
//         const data = await response.json();
        
//         if (data.ctl !== undefined) {
//             // Update your training load display here
//             console.log('Current training load:', data);
//         }
//     } catch (error) {
//         console.error('Error loading training data:', error);
//     }
// }
// /********************************/
// /* Endurance Session Functions */
// /********************************/

// let enduranceRoutes = [];
// let maxGrade = 0;
// let sessionDuration = 0; // minutes

// function addEndurance() {
//     const gradeValue = parseInt(document.getElementById('endurance-grade').value);
//     const routeDuration = parseInt(document.getElementById('endurance-duration').value);
//     maxGrade = parseInt(document.getElementById('max-endurance-grade').value);
//     let sDuration = parseInt(document.getElementById('session-duration').value);
//     sessionDuration = sDuration / 60; // Convert minutes to hours
//     let duration = routeDuration / 60; // Convert minutes to hours

//     if (!isNaN(gradeValue) && !isNaN(duration)) {
//         const route = { gradeValue, duration };
//         route.ctss = calculateEnduranceCTSS(route);
//         enduranceRoutes.push(route);

//         const newRow = document.createElement('tr');
//         newRow.style.animation = 'slideIn 0.5s ease-out';
//         newRow.innerHTML = `
//             <td>${enduranceRoutes.length}</td>
//             <td>${getYDSGrade(gradeValue)}</td>
//             <td>${duration * 60}</td>
//             <td>${route.ctss.toFixed(2)}</td>
//         `;
//         document.getElementById('added-endurance').append(newRow);

//         let sessionCtss = calculateEnduranceSessionCTSS();
//         document.getElementById('endurance-score').textContent = sessionCtss.toFixed(2);    
//     }
// }

// function calculateEnduranceCTSS(route) {
//     const normalizedGrade = route.gradeValue / maxGrade;
//     const routeLoad = Math.round(Math.pow(normalizedGrade, 2) * route.duration * 100) / 100;
//     return routeLoad;
// }

// function calculateEnduranceSessionCTSS() {
//     const totalClimbingTime = enduranceRoutes.reduce((sum, route) => sum + route.duration, 0);
//     const sessionDensity = totalClimbingTime / sessionDuration;
//     const sessionLoad = enduranceRoutes.reduce((sum, route) => sum + route.ctss, 0);
//     return Math.round(100 * 100 * sessionLoad * sessionDensity) / 100;
// }

// function clearEndurance() {
//     enduranceRoutes = [];
//     document.getElementById('added-endurance').innerHTML = '';
//     document.getElementById('endurance-score').textContent = '0';
// }

// function undoEndurance() {
//     if (enduranceRoutes.length > 0) {
//         enduranceRoutes.pop(); // Remove the last route from the array
//         updateEnduranceTable(); // Update the table display
//         calculateEnduranceSessionCTSS(); // Recalculate the session CTSS
//     } else {
//         alert("No routes/circuits to undo!");
//     }
// }

// function updateEnduranceTable() {
//     const tableBody = document.getElementById('added-endurance');
//     tableBody.innerHTML = ''; // Clear the current table
//     enduranceRoutes.forEach((route, index) => {
//         const newRow = document.createElement('tr');
//         newRow.innerHTML = `
//             <td>${index + 1}</td>
//             <td>${getYDSGrade(route.gradeValue)}</td>
//             <td>${route.duration}</td>
//             <td>${route.ctss}</td>
//         `;
//         tableBody.appendChild(newRow);
//     });
// }

// function submitEnduranceSession() {
//     const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
//     const sessionData = {
//         type: 'endurance',
//         date: currentDate,
//         totalCTSS: calculateEnduranceSessionCTSS(),
//         routes: enduranceRoutes
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
//         alert('Endurance session submitted successfully!');
//         fetchHistoricalData('endurance');
//     })
//     .catch((error) => {
//         console.error('Error:', error);
//         alert('Error submitting endurance session. Please try again.');
//     });

//     calculateTrainingLoad();
// }

// function ydsToValue(grade) {
//     const grades = {
//         "5.10-": 6, "5.10+": 7, "5.11-": 8, "5.11+": 9, "5.12-": 10,
//         "5.12+": 11, "5.13-": 12, "5.13+": 13, "5.14-": 14, "5.14+": 15
//     };
//     return grades[grade] || 0;
// }

// function getYDSGrade(value) {
//     const grades = {
//         6: "5.10-", 7: "5.10+", 8: "5.11-", 9: "5.11+", 10: "5.12-",
//         11: "5.12+", 12: "5.13-", 13: "5.13+", 14: "5.14-", 15: "5.14+"
//     };
//     return grades[value] || "Unknown";
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
//     fetchHistoricalData('endurance');
// });