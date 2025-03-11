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
let trainingLoadHistory = []

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

function getTodaysDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateDailyStress(bData, eData, hData) {
    let bss = bData.reduce((acc, item) => acc + item.totalCTSS, 0);
    let ess = eData.reduce((acc, item) => acc + item.totalCTSS, 0);
    let hss = hData.reduce((acc, item) => acc + item.totalCTSS, 0);

    console.log('Bouldering CTSS:', bss);
    console.log('Endurance CTSS:', ess);
    console.log('Hangboard CTSS:', hss);

    return bss + ess + hss;
}

function calcTodaysTrainingLoad(lastLoad, todayLoad) {
    let lastDate = new Date(lastLoad.date);
    let todaysDate = new Date(todayLoad.date);

    if (!lastDate || (lastLoad.ctl === 0 && lastLoad.atl === 0)) {
        // this is the first entry
        ctl = todayLoad.daily_stress;
        atl = todayLoad.daily_stress;
        tsb = 0;
    } else {
        let ctl = 0;
        let atl = 0;
        let tsb = 0;
        // calulate the number of days off between sessions
        console.log('Last date:', lastDate);
        console.log('Today\'s date:', todaysDate);

        const timeDiff = todaysDate - lastDate;
        const daysElapsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        console.log('Days elapsed:', daysElapsed);

        if (daysElapsed > 0) {
            // apply decays to account for recovery
            const ctlDecay = Math.pow(29/30, daysElapsed);
            const atlDecay = Math.pow(6/7, daysElapsed);
            ctl *= ctlDecay;
            atl *= atlDecay;
        }

        ctl = ctl * (29 / 30) + todayLoad.daily_stress * (1 / 30);
        atl = atl * (6 / 7) + todayLoad.daily_stress * (1 / 7);
        const roundedCtl = Math.round(ctl * 10) / 10;
        const roundedAtl = Math.round(atl * 10) / 10;
        tsb = roundedCtl - roundedAtl;

        todayLoad.ctl = roundedCtl;
        todayLoad.atl = roundedAtl;
        todayLoad.tsb = tsb;
    }
}

async function analyzeTodaysTrainingLoad(lastLoad, todaysLoad) {
    try {
        const date = new Date(todaysLoad.date);
        console.log('Today\'s date:', date);

        const bData = await fetchSessionHistory('bouldering');
        const filteredBData = bData.filter(item => item.date === date);

        const eData = await fetchSessionHistory('endurance');
        const filteredEData = eData.filter(item => item.date === date);

        const hData = await fetchSessionHistory('hangboard');
        const filteredHData = hData.filter(item => item.date === date);

        const dailyStress = calculateDailyStress(filteredBData, filteredEData, filteredHData);

        todaysLoad.daily_stress = dailyStress;

        calcTodaysTrainingLoad(lastLoad, todaysLoad);

    } catch (error) {
        console.error('Error analyzing training load:', error);
    }
}

async function analyzeAllTrainingLoads() {
    try {
        const loadHistory = await fetchSessionHistory('training_load');

        // sort by date
        loadHistory.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
        });

        let lastLoad = null;
        let todaysLoad = null;

        for (let i = 0; i < loadHistory.length; i++) {
            const load = loadHistory[i];
            if (i === 0) {
                lastLoad = load;
            } else if (i === 1) {
                todaysLoad = load;
            } else {
                lastLoad = todaysLoad;
                todaysLoad = load;
            }

            if (todaysLoad) {
                await analyzeTodaysTrainingLoad(lastLoad, todaysLoad);
            }
        }

    } catch (error) {
        console.error('Error analyzing training loads:', error);
    }
}

async function updateLatestTrainingLoad() {
    try {

        // const trainingLoad = await fetchSessionHistory('training_load');
        if (trainingLoadHistory.length === 0) {
            console.error('No training load data found');
            return;
        }

        const lastTrainingLoad = trainingLoadHistory[trainingLoadHistory.length - 1];
        const todaysDate = getTodaysDate();

        // find today's daily stress 
        const bData = await fetchSessionHistory('bouldering');
        const filteredBData = bData.filter(item => item.date === todaysDate);

        const eData = await fetchSessionHistory('endurance');
        const filteredEData = eData.filter(item => item.date === todaysDate);

        const hData = await fetchSessionHistory('hangboard');
        const filteredHData = hData.filter(item => item.date === todaysDate);

        const dailyStress = calculateDailyStress(filteredBData, filteredEData, filteredHData);

        if(lastTrainingLoad.date === todaysDate &&
            lastTrainingLoad.daily_stress === dailyStress) {

            console.log('Training load already submitted for today');
            return lastTrainingLoad;

        } else if (lastTrainingLoad.date === todaysDate) {
            // update the daily stress
            lastTrainingLoad.daily_stress = dailyStress;
        } else {

            // calculate the training load
            let todayLoad = {
                date: todaysDate,
                daily_stress: dailyStress,
                ctl: 0,
                atl: 0,
                tsb: 0
            };

            calcTodaysTrainingLoad(lastTrainingLoad, todayLoad);
            trainingLoadHistory.push(todayLoad);
            lastTrainingLoad = todayLoad;
        }

        // submit the training load
        const response = await fetch('/api/submit-training-load', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(lastTrainingLoad)
        });

        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
        alert('Error calculating or submitting training load. Please try again.');
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // check if the document is index.html
    if (document.title !== 'CTSS Calculator | Climbing Training Stress Score') {
        return
    }
 
    try {
        const loadHistory = await fetchSessionHistory('training_load');
        if (loadHistory.length === 0) {
            console.log('No training load data found. Initializing...');
            await analyzeAllTrainingLoads();
        } else {
            console.log('Training load data found. Updating latest entry...');
            trainingLoadHistory = loadHistory;
            const _ = await updateLatestTrainingLoad();
        }

        if (trainingLoadHistory.length === 0) {
            console.error('No training load data found');
            return;
        }

        displayTrainingLoad(trainingLoadHistory[trainingLoadHistory.length - 1]);
        createCtlChart();
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

async function displayTrainingLoad(load) {
   try {
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
                     <td>${load.daily_stress.toFixed(2)}</td>
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

        ret.trainingLoad = trainingLoadHistory;

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
