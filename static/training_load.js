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

function fetchHCTSS() {
    return fetch(`/api/hctss`)
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

function calculateDailyStress() {
    // fetch both bctss and ectss from server
    const bctss = fetchBCTSS();
    const ectss = fetchECTSS();
    const hctss = fetchHCTSS();

    // add all the ctss values that are from today and are not null together
    let totalCTSS = 0;
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    if (bctss != null && bctss.date === currentDate) {
        totalCTSS += bctss.totalCTSS;
    }
    if (ectss != null && ectss.date === currentDate) {
        totalCTSS += ectss.totalCTSS;
    }
    if (hctss != null && hctss.date === currentDate) {
        totalCTSS += hctss.totalCTSS;
    }

    return totalCTSS;
}

async function fetchBCTSS() {
    try {
        const response = await fetch(`/api/bctss`);
        const data = await response.json();
        if (data) {
            return data;
        } else if (data === null || data === undefined) {
            return null;
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        console.error('Error fetching bouldering CTSS:', error);
        return 0; // Default value in case of error
    }
}

async function fetchECTSS() {
    try {
        const response = await fetch(`/api/ectss`);
        const data = await response.json();
        if (data) {
            return data;
        } else if (data === null || data === undefined) {
            return null;
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        console.error('Error fetching endurance CTSS:', error);
        return 0; // Default value in case of error
    }
}

async function fetchHCTSS() {
    try {
        const response = await fetch(`/api/hctss`);
        const data = await response.json();
        if (data) {
            return data;
        } else if (data === null || data === undefined) {
            return null;
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        console.error('Error fetching hangboard CTSS:', error);
        return 0; // Default value in case of error
    }
}

async function calculateDailyStress() {
    // fetch both bctss and ectss from server
    const [bctss, ectss, hctss] = await Promise.all([
        fetchBCTSS(),
        fetchECTSS(),
        fetchHCTSS()
    ]);

    // add all the ctss values that are from today and are not null together
    let totalCTSS = 0;
    console.log('BCTSS:', bctss);
    console.log('ECTSS:', ectss);
    console.log('HCTSS:', hctss);
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    if (bctss != null && bctss.date === currentDate) {
        totalCTSS += bctss.totalCTSS;
    }
    if (ectss != null && ectss.date === currentDate) {
        totalCTSS += ectss.totalCTSS;
    }
    if (hctss != null && hctss.date === currentDate) {
        totalCTSS += hctss.totalCTSS;
    }

    return totalCTSS;
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

function fetchLastTrainingLoad() {
    return fetch(`/api/get-last-training-load`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                console.log('Data:', data);
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

function fetchCurrentTrainingLoad() {
    return fetch(`/api/get-current-training-load`)
        .then(response => response.json())
        .then(data => {
            if (data) {
                return data;
            }
            return null;
        })
        .catch(error => {
            console.error('Error fetching training load:', error);
            return null;
        });
}

// TODO calculate training load for current day if the day before there was no training
async function calculateTrainingLoad() {
    try {
        let dailyStress = await calculateDailyStress();
        console.log('Daily stress:', dailyStress);

        let load = await fetchLastTrainingLoad();
        const currentDate = new Date();
        console.log('Last training load:', load);

        if (load.Date === currentDate.toISOString().split('T')[0] &&
            load.daily_stress === dailyStress) {
            console.log('Training load already submitted for today');
            return load;
        }

        if (load.ctl === 0 && load.atl === 0) {
            load.ctl = dailyStress;
            load.atl = dailyStress;
        } else {

           // calculate the number of days since the last training load submission
            const timeDiff = currentDate - new Date(load.date);
            console.log('Time difference:', timeDiff);
            const daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            console.log('Days elapsed:', daysElapsed);

            if (daysElapsed > 0) {
                // apply decay to days with workouts
                console.log('Decaying training load');
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

        const trainingLoadData = {
            date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
            daily_stress: dailyStress,
            ctl: load.ctl,
            atl: load.atl,
            tsb: load.tsb,
        }

        // submit the training load if it's different from the last one
        const response = await fetch('/api/submit-training-load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(trainingLoadData)
        });

        const data = await response.json();
        console.log('Success:', data);

        return load;
    } catch (error) {
        console.error('Error:', error);
        alert('Error calculating or submitting training load. Please try again.');
        throw error;
    }
}

// TODO update the chronic and acute training loads based on historical data
// that it hasn't used yet

function displayTrainingLoad() {
    fetchCurrentTrainingLoad().then(load => {
        if (load === null || load === undefined) {
            return;
        }

        const tableHTML = `
            <table id="training-load-table">
                <tr>
                    <th>Date</th>
                    <th>Daily Stress</th>
                    <th>CTL</th>
                    <th>ATL</th>
                    <th>TSB</th>
                </tr>
                <tr>
                    <td>${load.date}</td>
                    <td>${load.daily_stress}</td>
                    <td>${load.ctl}</td>
                    <td>${load.atl}</td>
                    <td>${load.tsb.toFixed(2)}</td>
                </tr>
            </table>
        `;
        document.getElementById('training-load-container').innerHTML = tableHTML;

    }).catch(error => {
        console.error('Error in calculateTrainingLoad:', error);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    displayTrainingLoad();
});