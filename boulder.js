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

        calculateBoulderSessionCTSS();
    }
}

function calculateBoulderCTSS(boulder) {
    return (boulder.grade + 1) * boulder.attempts;
    //return Math.round((((problemScore * 1.4 + boulder.attempts * (boulder.rpe * 1.5)) / 526.5) * 100));
}

function calculateBoulderSessionCTSS() {
    const sessionCTSS = boulders.reduce((sum, boulder) => sum + boulder.ctss, 0);
    document.getElementById('bouldering-score').textContent = sessionCTSS;
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
    const sessionData = {
        type: 'bouldering',
        boulders: boulders,
        totalCTSS: calculateBoulderSessionCTSS()
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
        alert('Bouldering session submitted successfully!');
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error submitting bouldering session. Please try again.');
    });
}

