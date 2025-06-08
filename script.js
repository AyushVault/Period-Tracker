// Global variables
let currentUserData = null;
let calendarView = {
    year: new Date().getFullYear(),
    month: new Date().getMonth()
};
let cycleChart = null;
let symptomChart = null;
let selectedSymptoms = [];

// First-time setup
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has completed setup
    const userData = localStorage.getItem('femcareUserData');

    if (!userData) {
        // Show setup modal
        document.getElementById('setupModal').classList.add('active');
        // Set last period date to today by default
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('lastPeriod').value = formattedDate;
    } else {
        // User has completed setup, show app
        currentUserData = JSON.parse(userData);
        document.getElementById('setupModal').classList.remove('active');
        document.getElementById('mainApp').style.display = 'block';
        initializeApp();
    }

    // Setup form submission
    document.getElementById('setupForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form values
        const userData = {
            name: document.getElementById('userName').value,
            age: parseInt(document.getElementById('userAge').value),
            lastPeriod: document.getElementById('lastPeriod').value,
            cycleLength: parseInt(document.getElementById('cycleLength').value),
            periodLength: parseInt(document.getElementById('periodLength').value),
            symptomTracking: document.getElementById('symptomTracking').value,
            notifications: 'on',
            theme: 'light'
        };

        // Store in localStorage
        localStorage.setItem('femcareUserData', JSON.stringify(userData));
        currentUserData = userData;

        // Hide setup modal and show app
        document.getElementById('setupModal').classList.remove('active');
        document.getElementById('mainApp').style.display = 'block';

        // Initialize app
        initializeApp();

        // Show welcome toast
        showToast(`Welcome to FemCare, ${userData.name}!`);
    });

    // Initialize dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    const darkModeIcon = darkModeToggle.querySelector('i');

    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeIcon.classList.remove('fa-moon');
        darkModeIcon.classList.add('fa-sun');
    }

    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');

        if (document.body.classList.contains('dark-mode')) {
            darkModeIcon.classList.remove('fa-moon');
            darkModeIcon.classList.add('fa-sun');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            darkModeIcon.classList.remove('fa-sun');
            darkModeIcon.classList.add('fa-moon');
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    // Set up modal toggle buttons
    document.getElementById('logPeriodBtn').addEventListener('click', function() {
        // Set default dates for period logging
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('periodStartDate').value = formattedDate;

        // Set end date 5 days later by default
        const endDate = new Date();
        endDate.setDate(today.getDate() + 4);
        document.getElementById('periodEndDate').value = endDate.toISOString().split('T')[0];

        document.getElementById('logPeriodModal').classList.add('active');
    });

    document.getElementById('settingsBtn').addEventListener('click', function() {
        // Populate settings form with current data
        document.getElementById('settingsUserName').value = currentUserData.name;
        document.getElementById('settingsUserAge').value = currentUserData.age;
        document.getElementById('settingsLastPeriod').value = currentUserData.lastPeriod;
        document.getElementById('settingsCycleLength').value = currentUserData.cycleLength;
        document.getElementById('settingsPeriodLength').value = currentUserData.periodLength;
        document.getElementById('settingsSymptomTracking').value = currentUserData.symptomTracking;
        document.getElementById('notificationToggle').value = currentUserData.notifications;
        document.getElementById('themeToggle').value = currentUserData.theme;

        document.getElementById('settingsModal').classList.add('active');
    });

    document.getElementById('infoBtn').addEventListener('click', function() {
        document.getElementById('infoModal').classList.add('active');
    });

    // Close buttons for modals
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('close-btn')) {
                modal.classList.remove('active');
            }
        });
    });

    // Log Period form submission
    document.getElementById('logPeriodForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // Update last period date
        currentUserData.lastPeriod = document.getElementById('periodStartDate').value;
        localStorage.setItem('femcareUserData', JSON.stringify(currentUserData));

        // Close modal
        document.getElementById('logPeriodModal').classList.remove('active');

        // Update app
        updateCycleOverview();
        generateCalendar();

        // Show toast
        showToast('Period successfully logged!');
    });

    // Settings form submission
    document.getElementById('settingsForm').addEventListener('submit', function(e) {
        e.preventDefault();

        // Update user data
        currentUserData.name = document.getElementById('settingsUserName').value;
        currentUserData.age = parseInt(document.getElementById('settingsUserAge').value);
        currentUserData.lastPeriod = document.getElementById('settingsLastPeriod').value;
        currentUserData.cycleLength = parseInt(document.getElementById('settingsCycleLength').value);
        currentUserData.periodLength = parseInt(document.getElementById('settingsPeriodLength').value);
        currentUserData.symptomTracking = document.getElementById('settingsSymptomTracking').value;
        currentUserData.notifications = document.getElementById('notificationToggle').value;
        currentUserData.theme = document.getElementById('themeToggle').value;

        // Store in localStorage
        localStorage.setItem('femcareUserData', JSON.stringify(currentUserData));

        // Close modal
        document.getElementById('settingsModal').classList.remove('active');

        // Update app
        updateCycleOverview();
        generateCalendar();
        document.getElementById('welcomeName').textContent = `Welcome, ${currentUserData.name}!`;

        // Show toast
        showToast('Settings saved successfully!');
    });

    // Add symptom button
    document.getElementById('addSymptomBtn').addEventListener('click', function() {
        const symptomName = prompt('Enter symptom name:');
        if (symptomName) {
            addSymptomToGrid(symptomName);
        }
    });

    // Today button for calendar
    document.getElementById('todayBtn').addEventListener('click', function() {
        const today = new Date();
        calendarView.year = today.getFullYear();
        calendarView.month = today.getMonth();
        generateCalendar();
    });
});

// Initialize the app
function initializeApp() {
    // Set welcome name
    document.getElementById('welcomeName').textContent = `Welcome, ${currentUserData.name}!`;

    // Generate calendar
    generateCalendar();

    // Initialize charts
    initCharts();

    // Update cycle overview
    updateCycleOverview();

    // Add event listeners to symptom items
    document.querySelectorAll('.symptom-item').forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('selected');
            const symptomName = this.querySelector('div:last-child').textContent;

            if (this.classList.contains('selected')) {
                if (!selectedSymptoms.includes(symptomName)) {
                    selectedSymptoms.push(symptomName);
                }
            } else {
                selectedSymptoms = selectedSymptoms.filter(s => s !== symptomName);
            }

            // Update symptom chart with selected symptoms
            updateSymptomChart();
        });
    });

    // Set up calendar navigation
    document.getElementById('prev-month').addEventListener('click', function() {
        calendarView.month--;
        if (calendarView.month < 0) {
            calendarView.month = 11;
            calendarView.year--;
        }
        generateCalendar();
    });

    document.getElementById('next-month').addEventListener('click', function() {
        calendarView.month++;
        if (calendarView.month > 11) {
            calendarView.month = 0;
            calendarView.year++;
        }
        generateCalendar();
    });

    // Analyze button
    document.getElementById('analyzeBtn').addEventListener('click', function() {
        showToast('Cycle analysis updated!');
    });
}

// Update cycle overview based on user data
function updateCycleOverview() {
    if (!currentUserData) return;

    // Calculate cycle days based on user data
    const lastPeriod = new Date(currentUserData.lastPeriod);
    const today = new Date();
    today.setHours(0,0,0,0);

    // Calculate days since last period
    const diffTime = today - lastPeriod;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const cycleDay = (diffDays % currentUserData.cycleLength) + 1;

    // Calculate next period date
    let nextPeriod = new Date(lastPeriod);
    while (nextPeriod <= today) {
        nextPeriod.setDate(nextPeriod.getDate() + currentUserData.cycleLength);
    }
    const nextPeriodDiff = Math.ceil((nextPeriod - today) / (1000 * 60 * 60 * 24));

    // Calculate ovulation day
    const ovulationDay = Math.floor(currentUserData.cycleLength / 2);
    const fertileStart = Math.max(ovulationDay - 5, 1);
    const fertileEnd = Math.min(ovulationDay + 1, currentUserData.cycleLength);

    // Update UI
    document.getElementById('cycleDay').textContent = cycleDay;
    document.getElementById('cycleLengthDisplay').textContent = currentUserData.cycleLength;
    document.getElementById('nextPeriod').textContent = `${nextPeriodDiff} days`;
    document.getElementById('statCycleDay').textContent = cycleDay;
    document.getElementById('statNextPeriod').textContent = nextPeriodDiff;
    document.getElementById('statCycleLength').textContent = currentUserData.cycleLength;
    document.getElementById('statPeriodDuration').textContent = currentUserData.periodLength;

    // Update fertility status
    if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
        document.getElementById('fertilityStatus').textContent = 'High';
        document.querySelector('.cycle-card-icon.fertile').innerHTML = '<i class="fas fa-seedling"></i>';
        document.getElementById('fertileDays').textContent = `${fertileStart}-${fertileEnd}`;
    } else {
        document.getElementById('fertilityStatus').textContent = 'Low';
        document.querySelector('.cycle-card-icon.fertile').innerHTML = '<i class="fas fa-ban"></i>';
        document.getElementById('fertileDays').textContent = `${fertileStart}-${fertileEnd}`;
    }

    // Update ovulation date
    const ovulationDate = new Date(lastPeriod);
    ovulationDate.setDate(ovulationDate.getDate() + ovulationDay);
    document.getElementById('ovulationDate').textContent = ovulationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Update progress bar
    const progressPercent = (cycleDay / currentUserData.cycleLength) * 100;
    document.getElementById('cycleProgress').style.width = `${progressPercent}%`;

    // Update cycle phase
    let cyclePhase = '';
    if (cycleDay <= currentUserData.periodLength) {
        cyclePhase = 'Menstrual phase';
    } else if (cycleDay <= ovulationDay - 1) {
        cyclePhase = 'Follicular phase';
    } else if (cycleDay <= ovulationDay + 1) {
        cyclePhase = 'Ovulation phase';
    } else {
        cyclePhase = 'Luteal phase';
    }
    document.getElementById('cyclePhase').textContent = `Your cycle is currently in the ${cyclePhase}`;
}

// Calendar Generation
function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    // Clear existing days except headers
    while(calendarGrid.children.length > 7) {
        calendarGrid.removeChild(calendarGrid.lastChild);
    }

    const year = calendarView.year;
    const month = calendarView.month;

    // Get first day of month
    const firstDay = new Date(year, month, 1).getDay();

    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty days for the first week
    for(let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.classList.add('calendar-day', 'empty');
        calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    const today = new Date();
    for(let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        dayElement.textContent = day;

        // Mark today
        if(day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayElement.classList.add('today');
        }

        // Calculate cycle status based on user data
        if (currentUserData) {
            const lastPeriod = new Date(currentUserData.lastPeriod);
            const currentDate = new Date(year, month, day);
            const diffTime = Math.abs(currentDate - lastPeriod);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const cycleDay = (diffDays % currentUserData.cycleLength) + 1;

            // Calculate ovulation day
            const ovulationDay = Math.floor(currentUserData.cycleLength / 2);

            // Mark period days
            if (cycleDay <= currentUserData.periodLength) {
                dayElement.classList.add('period');
            }

            // Mark fertile window (5 days before ovulation to 1 day after)
            if (cycleDay >= ovulationDay - 5 && cycleDay <= ovulationDay + 1) {
                dayElement.classList.add('fertile');
            }

            // Mark ovulation day
            if (cycleDay === ovulationDay) {
                dayElement.classList.add('ovulation');
            }

            // Mark predicted period
            if (cycleDay > currentUserData.cycleLength - 3 || cycleDay < 3) {
                dayElement.classList.add('predicted');
            }
        }

        calendarGrid.appendChild(dayElement);
    }

    // Update month header
    const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
}

// Initialize Charts
function initCharts() {
    // Destroy existing charts if they exist
    if (cycleChart) {
        cycleChart.destroy();
    }
    if (symptomChart) {
        symptomChart.destroy();
    }

    // Cycle History Chart
    const cycleCtx = document.getElementById('cycleChart').getContext('2d');
    cycleChart = new Chart(cycleCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Cycle Length (Days)',
                data: [28, 27, 29, 28, 30, 28],
                borderColor: '#ff5e94',
                backgroundColor: 'rgba(255, 94, 148, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#ff5e94',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ff5e94'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 25,
                    max: 35,
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                }
            }
        }
    });

    // Symptom Analysis Chart
    const symptomCtx = document.getElementById('symptomChart').getContext('2d');
    symptomChart = new Chart(symptomCtx, {
        type: 'radar',
        data: {
            labels: ['Cramps', 'Headache', 'Bloating', 'Mood Swings', 'Fatigue', 'Acne'],
            datasets: [{
                label: 'Symptom Intensity',
                data: [8, 6, 7, 9, 7, 5],
                backgroundColor: 'rgba(156, 77, 204, 0.2)',
                borderColor: '#9c4dcc',
                pointBackgroundColor: '#9c4dcc',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#9c4dcc'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 10,
                    pointLabels: {
                        color: 'var(--text)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text)'
                    }
                }
            }
        }
    });
}

// Update symptom chart with selected symptoms
function updateSymptomChart() {
    if (!symptomChart) return;

    // Update chart data based on selected symptoms
    const symptomLabels = ['Cramps', 'Headache', 'Bloating', 'Mood Swings', 'Fatigue', 'Acne'];
    const symptomData = symptomLabels.map(label => {
        return selectedSymptoms.includes(label) ? 8 : 2;
    });

    symptomChart.data.datasets[0].data = symptomData;
    symptomChart.update();
}

// Add custom symptom to grid
function addSymptomToGrid(name) {
    const symptomsGrid = document.getElementById('symptomsGrid');

    const symptomItem = document.createElement('div');
    symptomItem.classList.add('symptom-item');
    symptomItem.innerHTML = `
        <div class="symptom-icon">
            <i class="fas fa-plus"></i>
        </div>
        <div>${name}</div>
    `;

    symptomItem.addEventListener('click', function() {
        this.classList.toggle('selected');
        if (this.classList.contains('selected')) {
            if (!selectedSymptoms.includes(name)) {
                selectedSymptoms.push(name);
            }
        } else {
            selectedSymptoms = selectedSymptoms.filter(s => s !== name);
        }
        updateSymptomChart();
    });

    symptomsGrid.appendChild(symptomItem);
    showToast(`Symptom "${name}" added!`);
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
