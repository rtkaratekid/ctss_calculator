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

async function fetchAllCss() {
    let ret = {};
    try {
        const response = await fetch(`/api/historical-data/bouldering`);
        const boulderData = await response.json();
        if (boulderData) {
            ret.bouldering = boulderData;
        }

        const response2 = await fetch(`/api/historical-data/endurance`);
        const enduranceData = await response2.json();
        if (enduranceData) {
            ret.endurance = enduranceData;
        }

        const response3 = await fetch(`/api/historical-data/hangboard`);
        const hangboardData = await response3.json();
        if (hangboardData) {
            ret.hangboard = hangboardData;
        }

        const response4 = await fetch(`/api/historical-data/training_load`);
        const trainingLoadData = await response4.json();
        if (trainingLoadData) {
            ret.trainingLoad = trainingLoadData
        }

    } catch (error) {
        console.error('Error fetching CSS:', error);
        return {}; // Default value in case of error
    }

    return ret;
}

function createCtlChart(data) {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const ctx = document.getElementById('ctl-chart').getContext('2d');

    // Prepare datasets
    const datasets = [
        {
            label: 'Bouldering CTSS',
            data: data.bouldering.map(item => ({ x: item.date, y: item.totalCTSS })),
            borderColor: isDarkMode ? '#ff6ad5' : '#4bc0c0',
            backgroundColor: isDarkMode ? 'rgba(255, 106, 213, 0.1)' : 'rgba(75, 192, 192, 0.1)',
            tension: 0.1
        },
        {
            label: 'Endurance CTSS',
            data: data.endurance.map(item => ({ x: item.date, y: item.totalCTSS })),
            borderColor: isDarkMode ? '#7ee8fa' : '#ff9f40',
            backgroundColor: isDarkMode ? 'rgba(126, 232, 250, 0.1)' : 'rgba(255, 159, 64, 0.1)',
            tension: 0.1
        },
        {
            label: 'Hangboard CTSS',
            data: data.hangboard.map(item => ({ x: item.date, y: item.totalCTSS })),
            borderColor: isDarkMode ? '#eeb86d' : '#9966ff',
            backgroundColor: isDarkMode ? 'rgba(238, 184, 109, 0.1)' : 'rgba(153, 102, 255, 0.1)',
            tension: 0.1
        },
        {
            label: 'Chronic Training Load',
            data: data.trainingLoad.map(item => ({ x: item.date, y: item.ctl })),
            borderColor: isDarkMode ? '#50fa7b' : '#ff6384',
            backgroundColor: isDarkMode ? 'rgba(80, 250, 123, 0.1)' : 'rgba(255, 99, 132, 0.1)',
            tension: 0.1
        },
        {
            label: 'Acute Training Load',
            data: data.trainingLoad.map(item => ({ x: item.date, y: item.atl })),
            borderColor: isDarkMode ? '#8be9fd' : '#36a2eb',
            backgroundColor: isDarkMode ? 'rgba(139, 233, 253, 0.1)' : 'rgba(54, 162, 235, 0.1)',
            tension: 0.1
        }
    ];

    new Chart(ctx, {
        type: 'line',
        data: { datasets },
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
                    type: 'time',
                    time: {
                        unit: 'day',
                        parser: 'yyyy-MM-dd', // Adjust this based on your date format
                        tooltipFormat: 'PP'
                    },

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
    displayTrainingLoad();
    fetchAllCss().then(data => {
        createCtlChart(data);
    }).catch(error => {
        console.error('Error fetching CSS:', error);
    });
});

