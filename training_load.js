function fetchBCTSS() {
    return fetch(`/api/bctss`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                return data;
            } else if (data === null || data === undefined) {
                return null;
            } else {
                throw new Error('Invalid data format');
            }
        })
        .catch(error => {
            console.error('Error fetching chronic training load:', error);
            return 0; // Default value in case of error
        });
}

function fetchECTSS() {
    return fetch(`/api/ectss`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                return data;
            } else if (data === null || data === undefined) {
                return null;
            } else {
                throw new Error('Invalid data format');
            }
        })
        .catch(error => {
            console.error('Error fetching chronic training load:', error);
            return 0; // Default value in case of error
        });
}

function calculateDailyStress(bctss, ectss) {
    // fetch both bctss and ectss from server
    const bctss = fetchBCTSS();
    const ectss = fetchECTSS();

    if (bctss === null && ectss === null) {
        // we have no data to calculate a daily stress
        return 0;
    }

    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    if (bctss.date != currentDate && ectss.date != currentDate) {
        // we have no data for today to calculate a daily stress
        return 0;
    }

    if (bctss === null) {
        return ectss.totalCTSS;
    } else if (ectss === null) {
        return bctss.totalCTSS;
    }

    return bctss.totalCTSS + ectss.totalCTSS;
}

/*
training load data looks like this 
{
    date: '2021-08-01',
    daily_stress: 100,
    ctl: 0,
    atl: 0,
    tsb: 0
}
*/

function fetchTrainingLoad() {
    return fetch(`/api/training-load`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                return data;
            } else if (data === null || data === undefined) {
                let currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
                return { date: currentDate, daily_stress: 0, ctl: 0, atl: 0, tsb: 0 };
            } else {
                throw new Error('Invalid data format');
            }
        })
        .catch(error => {
            console.error('Error fetching chronic training load:', error);
            return 0; // Default value in case of error
        });
}

function calculateTrainingLoad(dailyStress, currentDate) {

    let load = fetchTrainingLoad();

    if (load.ctl === 0 && load.atl === 0) {
         load.ctl = dailyStress;
         load.atl = dailyStress;
    } else {
        // calculate the number of days since the last training load submission
        const timeDiff = currentDate - new Date(load.date);
        const daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysElapsed > 0) {
            // apply decay to days with workouts
            const ctlDecay = Math.pow(29/30, daysElapsed);
            const atlDecay = Math.pow(6/7, daysElapsed);
            load.ctl *= ctlDecay;
            load.atl *= atlDecay;
        }

        // calculate the chronic training load
        load.ctl = (load.ctl * (29 / 30)) + (dailyStress * (1 / 30));
        load.ctl = Math.round(load.ctl * 10) / 10;

        // calculate the acute training load
        load.atl = (load.atl * (6 / 7)) + (dailyStress * (1 / 7));
        load.atl = Math.round(load.atl * 10) / 10;

        // calculate the training stress balance
        load.tsb = load.ctl - load.atl;
    }

    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const trainingLoadData = {
        date: currentDate,
        daily_stress: dailyStress,
        ctl: load.ctl,
        atl: load.atl,
        tsb: load.tsb,
    }

    fetch('/api/submit-training-load', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingLoadData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        alert('Training load submitted successfully!');
        fetchHistoricalData('bouldering'); // Fetch updated data after submission
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Error submitting training load. Please try again.');
    });

    return load;
}