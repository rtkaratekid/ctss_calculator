
// function that fetches the historical data for a given session type
// types include bouldering, endurance, and hangboard
// returns an array of objects with the following format:
// {
//     date: '2021-08-01',
//     totalCTSS: 100
// }
// function fetchSessionHistory(sessionType) {
//     fetch(`/api/historical-data/${sessionType}`)
//         .then(response => response.json())
//         .then(data => {
//             if (data) {
//                 console.log('Data:', data);
//                 return data;
//             } else {
//                 return [];
//             }
//         })
//         .catch(error => console.error('Error fetching historical data:', error));
// }

// function calculateDailyStress() {

//     // if there is no data, default to 0
//     let bctss = 0 
//     let ectss = 0
//     let hctss = 0
//     let date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

//     let bData = fetchSessionHistory('bouldering');
//     console.log('Bouldering data:', bData);
//     // filter out all the data that does not have today's date
//     bData = bData.filter(item => item.date === date);
//     if (bctss.length === 1) {
//         // if there is only one item in the array, get the totalCTSS value
//         bctss = bctss[0].totalCTSS;
//     } else if (bctss.length > 1) {
//         // if there are multiple items in the array, add all the totalCTSS values together
//         bctss = bctss.reduce((acc, item) => acc + item.totalCTSS, 0);
//     }

//     let eData = fetchSessionHistory('endurance');
//     // filter out all the data that does not have today's date
//     eData = eData.filter(item => item.date === date);
//     if (ectss.length === 1) {
//         // if there is only one item in the array, get the totalCTSS value
//         ectss = ectss[0].totalCTSS;
//     } else if (ectss.length > 1) {
//         // if there are multiple items in the array, add all the totalCTSS values together
//         ectss = ectss.reduce((acc, item) => acc + item.totalCTSS, 0);
//     }

//     let hData = fetchSessionHistory('hangboard');
//     // filter out all the data that does not have today's date
//     hData = hData.filter(item => item.date === date);
//     if (hctss.length === 1) {
//         // if there is only one item in the array, get the totalCTSS value
//         hctss = hctss[0].totalCTSS;
//     } else if (hctss.length > 1) {
//         // if there are multiple items in the array, add all the totalCTSS values together
//         hctss = hctss.reduce((acc, item) => acc + item.totalCTSS, 0);
//     }

//     return bctss + ectss + hctss;
// }

async function fetchSessionHistory(sessionType) {
    try {
        const response = await fetch(`/api/historical-data/${sessionType}`);
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return [];
    }
}

function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

async function calculateDailyStress() {
    let bctss = 0;
    let ectss = 0;
    let hctss = 0;
    // const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const date = getTodayDate();
    console.log('Today\'s date:', date);

    const bData = await fetchSessionHistory('bouldering');
    const filteredBData = bData.filter(item => item.date === date);
    console.log('Filtered bouldering data:', filteredBData);
    bctss = filteredBData.reduce((acc, item) => acc + item.totalCTSS, 0);

    const eData = await fetchSessionHistory('endurance');
    const filteredEData = eData.filter(item => item.date === date);
    ectss = filteredEData.reduce((acc, item) => acc + item.totalCTSS, 0);

    const hData = await fetchSessionHistory('hangboard');
    const filteredHData = hData.filter(item => item.date === date);
    hctss = filteredHData.reduce((acc, item) => acc + item.totalCTSS, 0);

    console.log('Bouldering CTSS:', bctss);
    console.log('Endurance CTSS:', ectss);
    console.log('Hangboard CTSS:', hctss);

    return bctss + ectss + hctss;
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
async function fetchCurrentTrainingLoad() {
    try {
        const response = await fetch(`/api/get-current-training-load`);
        const data = await response.json();
        return data || null;
    } catch (error) {
        console.error('Error fetching training load:', error);
        return null;
    }
}

async function calculateTrainingLoad() {
    try {
        const dailyStress = await calculateDailyStress();
        console.log('Daily stress:', dailyStress);

        const loadHistory = await fetchSessionHistory('training_load');
        let load = loadHistory[loadHistory.length - 1] || { ctl: 0, atl: 0 };

        // const currentDate = new Date();
        const date = getTodayDate();
        const currentDate = new Date(date);
        console.log('Last training load:', load);

        if (load.date === currentDate &&
            load.daily_stress === dailyStress) {
            console.log('Training load already submitted for today');
            return load;
        }

        if (load.ctl === 0 && load.atl === 0) {
            load.ctl = dailyStress;
            load.atl = dailyStress;
            load.tsb = 0;
        } else {
            const timeDiff = currentDate - new Date(load.date);
            console.log('Time difference:', timeDiff);
            const daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            console.log('Days elapsed:', daysElapsed);

            if (daysElapsed > 0) {
                console.log('Decaying training load');
                const ctlDecay = Math.pow(29/30, daysElapsed);
                const atlDecay = Math.pow(6/7, daysElapsed);
                load.ctl *= ctlDecay;
                load.atl *= atlDecay;
            }

            load.ctl = (load.ctl * (29 / 30)) + (dailyStress * (1 / 30));
            load.ctl = Math.round(load.ctl * 10) / 10;

            load.atl = (load.atl * (6 / 7)) + (dailyStress * (1 / 7));
            load.atl = Math.round(load.atl * 10) / 10;

            load.tsb = load.ctl - load.atl;
        }

        const trainingLoadData = {
            date: date,
            daily_stress: dailyStress,
            ctl: load.ctl,
            atl: load.atl,
            tsb: load.tsb,
        };

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

// TODO calculate training load for current day if the day before there was no training
// async function calculateTrainingLoad() {
//     try {
//         let dailyStress = await calculateDailyStress();
//         console.log('Daily stress:', dailyStress);

//         // let load = await fetchLastTrainingLoad();
//         let loadHistory = fetchSessionHistory('training_load');
//         // get the last item in the array
//         let Load = loadHistory[lastLoad.length - 1];

//         const currentDate = new Date();
//         console.log('Last training load:', load);

//         // if the last training load is from today and the daily stress is the same,
//         // return the load
//         if (load.Date === currentDate.toISOString().split('T')[0] &&
//             load.daily_stress === dailyStress) {
//             console.log('Training load already submitted for today');
//             return load;
//         }

//         if (load.ctl === 0 && load.atl === 0) {
//             load.ctl = dailyStress;
//             load.atl = dailyStress;
//         } else {

//            // calculate the number of days since the last training load submission
//             const timeDiff = currentDate - new Date(load.date);
//             console.log('Time difference:', timeDiff);
//             const daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
//             console.log('Days elapsed:', daysElapsed);

//             if (daysElapsed > 0) {
//                 // apply decay to days with workouts
//                 console.log('Decaying training load');
//                 const ctlDecay = Math.pow(29/30, daysElapsed);
//                 const atlDecay = Math.pow(6/7, daysElapsed);
//                 load.ctl *= ctlDecay;
//                 load.atl *= atlDecay;
//             }

//             // calculate the chronic training load
//             load.ctl = (load.ctl * (29 / 30)) + (dailyStress * (1 / 30));
//             load.ctl = Math.round(load.ctl * 10) / 10;

//             // calculate the acute training load
//             load.atl = (load.atl * (6 / 7)) + (dailyStress * (1 / 7));
//             load.atl = Math.round(load.atl * 10) / 10;

//             // calculate the training stress balance
//             load.tsb = load.ctl - load.atl;
//         }

//         const trainingLoadData = {
//             date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
//             daily_stress: dailyStress,
//             ctl: load.ctl,
//             atl: load.atl,
//             tsb: load.tsb,
//         }

//         // submit the training load if it's different from the last one
//         const response = await fetch('/api/submit-training-load', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(trainingLoadData)
//         });

//         const data = await response.json();
//         console.log('Success:', data);

//         return load;
//     } catch (error) {
//         console.error('Error:', error);
//         alert('Error calculating or submitting training load. Please try again.');
//         throw error;
//     }
// }

// TODO update the chronic and acute training loads based on historical data
// that it hasn't used yet
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await displayTrainingLoad();
        createCtlChart();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

async function displayTrainingLoad() {
    try {
        const load = await calculateTrainingLoad();
        const container = document.getElementById('training-load-container');
        if (container) {
            container.innerHTML = `
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
        } else {
            console.error('Training load container not found');
        }
    } catch (error) {
        console.error('Error in displayTrainingLoad:', error);
    }
}

async function fetchAllCss() {
    let ret = {};
    try {
        const bData = await fetchSessionHistory('bouldering');
        ret.bouldering = bData;
    
        const eData = await fetchSessionHistory('endurance');
        ret.endurance = eData;
    
        const hData = await fetchSessionHistory('hangboard');
        ret.hangboard = hData;

        const tData = await fetchSessionHistory('training_load');
        ret.trainingLoad = tData;

       return ret;

    } catch (error) {
        console.error('Error fetching CSS:', error);
        return {}; // Default value in case of error
    }
}

async function createCtlChart() {
    try {
        const data = await fetchAllCss();
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
    } catch (error) {
        console.error('Error creating CTL chart:', error);
    }
}
