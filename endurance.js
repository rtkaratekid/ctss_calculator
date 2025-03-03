/********************************/
/* Endurance Session Functions */
/********************************/

let enduranceRoutes = [];

function addEndurance() {
    const gradeValue = parseInt(document.getElementById('endurance-grade').value);
    const duration = parseInt(document.getElementById('endurance-duration').value);

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

        calculateEnduranceSessionCTSS();
    }
}

function calculateEnduranceCTSS(route) {
    return Math.round((route.gradeValue * 0.4 + route.duration * 0.5));
}

function calculateEnduranceSessionCTSS() {
    const sessionCTSS = enduranceRoutes.reduce((sum, route) => sum + route.ctss, 0);
    document.getElementById('endurance-score').textContent = sessionCTSS;
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
    const sessionData = {
        type: 'endurance',
        routes: enduranceRoutes,
        totalCTSS: calculateEnduranceSessionCTSS()
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
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error submitting endurance session. Please try again.');
    });
}

function getYDSGrade(value) {
    const grades = {
        6: "5.10-", 7: "5.10+", 8: "5.11-", 9: "5.11+", 10: "5.12-",
        11: "5.12+", 12: "5.13-", 13: "5.13+", 14: "5.14-", 15: "5.14+"
    };
    return grades[value] || "Unknown";
}

