/* --- Utilities & Storage helpers --- */
const STORAGE_KEYS = {
    FOCUS_TASKS: 'momentum_focus_tasks',
    GOALS: 'momentum_goals',
    EVENTS: 'momentum_enhanced_events'
};

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

function loadData(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = safeParse(raw);
    return Array.isArray(parsed) ? parsed : [];
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
    }
}

/* --- Navigation --- */
function createMiniPlanner() {
    const container = document.createElement('div');

    const title = document.createElement('h2');
    title.textContent = 'Weekly Overview';
    title.style.marginBottom = '1rem';
    container.appendChild(title);

    const plannerGrid = document.createElement('div');
    plannerGrid.style.display = 'grid';
    plannerGrid.style.gridTemplateColumns = '60px repeat(7, 1fr)';
    plannerGrid.style.gap = '2px';
    plannerGrid.style.fontSize = '0.75rem';
    
    // Create day headers
    plannerGrid.appendChild(document.createElement('div')); // Empty corner
    DAYS.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day.substring(0, 3);
        dayHeader.style.fontWeight = 'bold';
        dayHeader.style.textAlign = 'center';
        dayHeader.style.color = '#556ee6';
        dayHeader.style.padding = '4px';
        dayHeader.style.background = '#f8f9fa';
        dayHeader.style.border = '1px solid #dee2e6';
        plannerGrid.appendChild(dayHeader);
    });

    // Create hour rows
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM
    hours.forEach(hour => {
        // Time label
        const timeLabel = document.createElement('div');
        timeLabel.textContent = `${hour}:00`;
        timeLabel.style.fontWeight = '500';
        timeLabel.style.color = '#495057';
        timeLabel.style.textAlign = 'center';
        timeLabel.style.padding = '4px';
        timeLabel.style.background = '#f8f9fa';
        timeLabel.style.border = '1px solid #dee2e6';
        plannerGrid.appendChild(timeLabel);

        // Day slots for this hour
        DAYS.forEach(day => {
            const slot = document.createElement('div');
            slot.style.minHeight = '25px';
            slot.style.background = '#fdfdfd';
            slot.style.border = '1px solid #eee';
            slot.style.borderRadius = '3px';
            slot.style.padding = '2px 4px';
            slot.style.overflow = 'hidden';
            slot.style.whiteSpace = 'nowrap';
            slot.style.textOverflow = 'ellipsis';
            slot.style.fontSize = '0.7rem';
            
            // Find event starting in this hour on this day
            const event = events.find(ev => ev.day === day && ev.from.startsWith(String(hour).padStart(2, '0')));
            if (event) {
                slot.textContent = event.title;
                slot.title = event.title; // Tooltip on hover
                slot.style.fontWeight = '500';
                slot.style.color = 'white';
                
                // Style based on priority
                if (event.priority === 'high') {
                    slot.style.background = '#ff6b6b';
                } else if (event.priority === 'medium') {
                    slot.style.background = '#feca57';
                    slot.style.color = '#333';
                } else {
                    slot.style.background = '#556ee6';
                }
            }
            plannerGrid.appendChild(slot);
        });
    });

    container.appendChild(plannerGrid);
    return container;
}

function renderMiniPlanner() {
    const container = document.getElementById('mini-planner-container');
    if (container) {
        container.innerHTML = '';
        container.appendChild(createMiniPlanner());
    }
}

/* --- Navigation --- */
document.addEventListener('DOMContentLoaded', function () {
    const tabs = document.querySelectorAll('.tabs li');
    const pages = document.querySelectorAll('.page');

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetPageId = `page-${this.getAttribute('data-page')}`;

            tabs.forEach(t => t.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));

            this.classList.add('active');
            document.getElementById(targetPageId)?.classList.add('active');
        });
    });
});

/* --- Enhanced Calendar Integration --- */
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Generate times every 15 minutes from 8:00 to 20:45
let times = [];
for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
        if (h === 20 && m > 45) break; // Stop at 20:45
        times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
}

let events = loadData(STORAGE_KEYS.EVENTS);

// Frequency handling
document.getElementById('frequency').onchange = function() {
    const freqOptions = document.getElementById('frequency-options');
    const customDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    if (this.value === 'once') {
        freqOptions.classList.remove('show');
    } else {
        freqOptions.classList.add('show');

        customDays.forEach(day => {
            const checkbox = document.getElementById(day);
            checkbox.checked = false;
        });

        if (this.value === 'weekdays') {
            ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
                document.getElementById(day).checked = true;
            });
        } else if (this.value === 'weekends') {
            ['sat', 'sun'].forEach(day => {
                document.getElementById(day).checked = true;
            });
        } else if (this.value === 'daily') {
            customDays.forEach(day => {
                document.getElementById(day).checked = true;
            });
        } else if (this.value === 'weekly') {
            const currentDay = document.getElementById('day').value;
            const dayIndex = DAYS.indexOf(currentDay);
            if (dayIndex !== -1) {
                document.getElementById(SHORT_DAYS[dayIndex].toLowerCase()).checked = true;
            }
        }
    }
};

function tMin(t) {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function roundToNearestSlot(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const totalMinutes = h * 60 + m;

    // Round to nearest 15 minutes
    const rounded = Math.round(totalMinutes / 15) * 15;
    const hours = Math.floor(rounded / 60);
    const minutes = rounded % 60;

    if (hours < 8) return '08:00';
    if (hours > 20 || (hours === 20 && minutes > 45)) return '20:45';

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function renderPlanner() {
    const planner = document.getElementById('planner');
    planner.innerHTML = '';

    // Create the grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'planner-grid';

    // Create header row
    const timeHeader = document.createElement('div');
    timeHeader.className = 'time-header';
    timeHeader.textContent = 'Time';
    gridContainer.appendChild(timeHeader);

    DAYS.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.textContent = day;
        gridContainer.appendChild(dayHeader);
    });

    // Create time slot rows with slots
    const slotRefs = {};
    times.forEach((time, timeIndex) => {
        // Time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = time;
        gridContainer.appendChild(timeLabel);

        // Day slots for this time
        DAYS.forEach((day, dayIndex) => {
            const slot = document.createElement('div');
            slot.className = 'slot';
            slot.dataset.day = day;
            slot.dataset.time = time;
            slot.dataset.timeIndex = timeIndex;
            slot.dataset.dayIndex = dayIndex;

            slotRefs[`${day}-${timeIndex}`] = slot;
            gridContainer.appendChild(slot);
        });
    });

    planner.appendChild(gridContainer);

    // Render events with better height calculation
    events.forEach((ev, eventIndex) => {
        const dayIndex = DAYS.indexOf(ev.day);
        if (dayIndex === -1) return;

        // Find the closest time slots for start and end
        const startTimeRounded = roundToNearestSlot(ev.from);
        const endTimeRounded = roundToNearestSlot(ev.to);
        
        const startTimeIndex = times.indexOf(startTimeRounded);
        const endTimeIndex = times.indexOf(endTimeRounded);

        if (startTimeIndex === -1 || endTimeIndex === -1 || startTimeIndex >= endTimeIndex) return;

        const startSlot = slotRefs[`${ev.day}-${startTimeIndex}`];
        if (!startSlot) return;

        // Calculate exact height based on the number of slots to span
        const slotsToSpan = endTimeIndex - startTimeIndex;
        const slotHeight = 22; // 20px + 2px border
        const eventHeight = (slotsToSpan * slotHeight) - 2; // Subtract 2px for event borders

        const eventDiv = document.createElement('div');
        eventDiv.className = `event ${ev.priority}`;
        eventDiv.style.height = eventHeight + 'px';
        eventDiv.title = `${ev.from} - ${ev.to}: ${ev.title}`;

        const content = document.createElement('div');
        content.className = 'event-content';
        content.textContent = ev.title;

        if (ev.frequency && ev.frequency !== 'once') {
            const freqSpan = document.createElement('div');
            freqSpan.className = 'event-frequency';
            freqSpan.textContent = ev.frequency;
            content.appendChild(freqSpan);

            const recurringIcon = document.createElement('div');
            recurringIcon.className = 'recurring-indicator';
            recurringIcon.textContent = '↻';
            eventDiv.appendChild(recurringIcon);
        }

        eventDiv.appendChild(content);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete event';
        deleteBtn.onclick = e => {
            e.stopPropagation();
            events.splice(eventIndex, 1);
            saveData(STORAGE_KEYS.EVENTS, events);
            renderPlanner();
            updateDashboardWidgets();
        };
        eventDiv.appendChild(deleteBtn);

        startSlot.appendChild(eventDiv);
    });
}

function createRecurringEvents(baseEvent) {
    const frequency = baseEvent.frequency;
    const customDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    if (frequency === 'once') {
        return [baseEvent];
    }

    const recurringEvents = [];
    const selectedDays = [];

    if (frequency === 'custom') {
        customDays.forEach((day, index) => {
            if (document.getElementById(day).checked) {
                selectedDays.push(DAYS[index]);
            }
        });
    } else if (frequency === 'daily') {
        selectedDays.push(...DAYS);
    } else if (frequency === 'weekdays') {
        selectedDays.push('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday');
    } else if (frequency === 'weekends') {
        selectedDays.push('Saturday', 'Sunday');
    } else if (frequency === 'weekly') {
        selectedDays.push(baseEvent.day);
    }

    selectedDays.forEach(day => {
        recurringEvents.push({
            ...baseEvent,
            day: day,
            frequency: frequency
        });
    });

    return recurringEvents;
}

document.getElementById('addBtn').onclick = () => {
    const title = document.getElementById('title').value.trim();
    const day = document.getElementById('day').value;
    const from = document.getElementById('from').value;
    const to = document.getElementById('to').value;
    const priority = document.getElementById('priority').value;
    const frequency = document.getElementById('frequency').value;

    if (!title || !from || !to) {
        alert('Please fill in all required fields');
        return;
    }

    if (tMin(to) <= tMin(from)) {
        alert('"To" time must be later than "From" time');
        return;
    }

    const fromRounded = roundToNearestSlot(from);
    const toRounded = roundToNearestSlot(to);

    const baseEvent = {
        title,
        day,
        from: fromRounded,
        to: toRounded,
        priority,
        frequency
    };

    const newEvents = createRecurringEvents(baseEvent);
    events.push(...newEvents);
    saveData(STORAGE_KEYS.EVENTS, events);

    renderPlanner();
    updateDashboardWidgets();

    // Clear form
    document.getElementById('title').value = '';
    document.getElementById('from').value = '';
    document.getElementById('to').value = '';
    document.getElementById('frequency').value = 'once';
    document.getElementById('frequency-options').classList.remove('show');
};

/* --- Dashboard: Focus Tasks --- */
const focusTaskInput = document.getElementById('focusTaskInput');
const addFocusTaskBtn = document.getElementById('addFocusTaskBtn');
const todaysFocusList = document.getElementById('todays-focus-list');

function renderFocusTasks() {
    const tasks = loadData(STORAGE_KEYS.FOCUS_TASKS);
    todaysFocusList.innerHTML = '';
    tasks.forEach((task, idx) => {
        const li = document.createElement('li');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = task.title;
        li.appendChild(titleSpan);

        const controls = document.createElement('span');
        const edit = document.createElement('button');
        edit.className = 'small-btn';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
            const newTitle = prompt('Edit task title', task.title);
            if (newTitle !== null && newTitle.trim()) {
                tasks[idx].title = newTitle.trim();
                saveData(STORAGE_KEYS.FOCUS_TASKS, tasks);
                renderFocusTasks();
                updateDashboardWidgets();
            }
        });

        const del = document.createElement('button');
        del.className = 'small-btn';
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
            if (confirm('Delete this focus task?')) {
                tasks.splice(idx, 1);
                saveData(STORAGE_KEYS.FOCUS_TASKS, tasks);
                renderFocusTasks();
                updateDashboardWidgets();
            }
        });

        controls.appendChild(edit);
        controls.appendChild(del);
        li.appendChild(controls);

        todaysFocusList.appendChild(li);
    });
}

addFocusTaskBtn.onclick = () => {
    const val = focusTaskInput.value.trim();
    if (!val) {
        alert('Enter a focus task title');
        return;
    }
    const tasks = loadData(STORAGE_KEYS.FOCUS_TASKS);
    tasks.push({
        title: val
    });
    saveData(STORAGE_KEYS.FOCUS_TASKS, tasks);
    focusTaskInput.value = '';
    renderFocusTasks();
    updateDashboardWidgets();
};

/* --- Goals --- */
const goalTitleInput = document.getElementById('goalTitleInput');
const goalStepsInput = document.getElementById('goalStepsInput');
const saveGoalBtn = document.getElementById('saveGoalBtn');
const goalsContainer = document.getElementById('goals-container');

function renderGoals() {
    const goals = loadData(STORAGE_KEYS.GOALS);
    goalsContainer.innerHTML = '';

    goals.forEach((goal, gIndex) => {
        const container = document.createElement('section');
        container.className = 'goal';

        const h2 = document.createElement('h2');
        h2.textContent = goal.title;
        container.appendChild(h2);

        // roadmap
        const roadmap = document.createElement('div');
        roadmap.className = 'roadmap';
        roadmap.setAttribute('aria-label', `Goal roadmap for ${goal.title}`);
        goal.steps.forEach(step => {
            const m = document.createElement('div');
            m.className = 'milestone';
            m.textContent = step.title;
            roadmap.appendChild(m);
        });
        container.appendChild(roadmap);

        // progress
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        const progress = document.createElement('div');
        progress.className = 'progress';
        const completedCount = goal.steps.filter(s => s.completed).length;
        const percent = goal.steps.length ? Math.round((completedCount / goal.steps.length) * 100) : 0;
        progress.style.width = percent + '%';
        progressBar.appendChild(progress);
        container.appendChild(progressBar);

        // step list
        const ul = document.createElement('ul');
        ul.className = 'goal-steps';
        goal.steps.forEach((step, sIndex) => {
            const li = document.createElement('li');
            li.className = step.completed ? 'completed' : '';
            const left = document.createElement('span');
            left.textContent = step.title;
            left.style.flex = '1';
            li.appendChild(left);

            const controls = document.createElement('span');

            const toggleBtn = document.createElement('button');
            toggleBtn.textContent = step.completed ? 'Mark Incomplete' : 'Mark Complete';
            toggleBtn.className = 'small-btn';
            toggleBtn.addEventListener('click', () => {
                const gs = loadData(STORAGE_KEYS.GOALS);
                gs[gIndex].steps[sIndex].completed = !gs[gIndex].steps[sIndex].completed;
                saveData(STORAGE_KEYS.GOALS, gs);
                renderGoals();
                updateDashboardWidgets();
            });

            const editBtn = document.createElement('button');
            editBtn.className = 'small-btn';
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                const newTitle = prompt('Edit step title', step.title);
                if (newTitle !== null && newTitle.trim()) {
                    const gs = loadData(STORAGE_KEYS.GOALS);
                    gs[gIndex].steps[sIndex].title = newTitle.trim();
                    saveData(STORAGE_KEYS.GOALS, gs);
                    renderGoals();
                    updateDashboardWidgets();
                }
            });

            const delBtn = document.createElement('button');
            delBtn.className = 'small-btn';
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', () => {
                if (!confirm('Delete step?')) return;
                const gs = loadData(STORAGE_KEYS.GOALS);
                gs[gIndex].steps.splice(sIndex, 1);
                saveData(STORAGE_KEYS.GOALS, gs);
                renderGoals();
                updateDashboardWidgets();
            });

            controls.appendChild(toggleBtn);
            controls.appendChild(editBtn);
            controls.appendChild(delBtn);
            li.appendChild(controls);

            ul.appendChild(li);
        });
        container.appendChild(ul);

        // goal-level controls: edit/delete
        const goalControls = document.createElement('div');
        goalControls.style.marginTop = '8px';
        const editGoalBtn = document.createElement('button');
        editGoalBtn.className = 'small-btn';
        editGoalBtn.textContent = 'Edit Goal Title';
        editGoalBtn.addEventListener('click', () => {
            const newTitle = prompt('Edit goal title', goal.title);
            if (newTitle !== null && newTitle.trim()) {
                const gs = loadData(STORAGE_KEYS.GOALS);
                gs[gIndex].title = newTitle.trim();
                saveData(STORAGE_KEYS.GOALS, gs);
                renderGoals();
                updateDashboardWidgets();
            }
        });

        const delGoalBtn = document.createElement('button');
        delGoalBtn.className = 'small-btn';
        delGoalBtn.textContent = 'Delete Goal';
        delGoalBtn.addEventListener('click', () => {
            if (!confirm('Delete entire goal?')) return;
            const gs = loadData(STORAGE_KEYS.GOALS);
            gs.splice(gIndex, 1);
            saveData(STORAGE_KEYS.GOALS, gs);
            renderGoals();
            updateDashboardWidgets();
        });

        goalControls.appendChild(editGoalBtn);
        goalControls.appendChild(delGoalBtn);
        container.appendChild(goalControls);

        goalsContainer.appendChild(container);
    });
}

saveGoalBtn.onclick = () => {
    const title = goalTitleInput.value.trim();
    const stepsRaw = goalStepsInput.value.split(',').map(s => s.trim()).filter(Boolean);
    if (!title || stepsRaw.length === 0) {
        alert('Enter goal title and at least one step');
        return;
    }

    const steps = stepsRaw.map(s => ({
        title: s,
        completed: false
    }));
    const goals = loadData(STORAGE_KEYS.GOALS);
    goals.push({
        title,
        steps,
        createdAt: Date.now()
    });
    saveData(STORAGE_KEYS.GOALS, goals);

    goalTitleInput.value = '';
    goalStepsInput.value = '';
    renderGoals();
    updateDashboardWidgets();
};

document.getElementById('add-goal-btn').addEventListener('click', () => {
    document.querySelector('[data-page="goals"]').click();
});

/* --- Dashboard widgets update --- */
function updateDashboardWidgets() {
    // Render the mini planner
    renderMiniPlanner();

    // Upcoming deadlines
    const deadlinesList = document.getElementById('upcoming-deadlines-list');
    deadlinesList.innerHTML = '';
    const goals = loadData(STORAGE_KEYS.GOALS);
    goals.forEach(goal => {
        if (Array.isArray(goal.steps) && goal.steps.length > 0) {
            const lastStep = goal.steps[goal.steps.length - 1];
            const li = document.createElement('li');
            li.textContent = `${lastStep.title || lastStep} — ${goal.title}`;
            deadlinesList.appendChild(li);
        }
    });

    // Today's Focus: Get correct today
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 indexing
    const todayName = DAYS[todayIndex];
    
    const allEvents = loadData(STORAGE_KEYS.EVENTS);
    const todayEvents = allEvents.filter(ev => ev.day === todayName);

    const todaysList = document.getElementById('todays-focus-list');
    todaysList.innerHTML = '';

    // Add enhanced calendar events
    todayEvents.sort((a, b) => tMin(a.from) - tMin(b.from)).forEach((ev, i) => {
        const li = document.createElement('li');
        const titleSpan = document.createElement('span');
        const timeRange = ev.from && ev.to ? `${ev.from}-${ev.to}` : '';
        const frequencyTag = ev.frequency && ev.frequency !== 'once' ? ` [${ev.frequency}]` : '';
        titleSpan.textContent = `[Event] ${timeRange} ${ev.title}${frequencyTag}`;
        li.appendChild(titleSpan);

        const controls = document.createElement('span');
        const edit = document.createElement('button');
        edit.className = 'small-btn';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
            const newTitle = prompt('Edit event title', ev.title);
            if (newTitle !== null && newTitle.trim()) {
                const eventToUpdate = allEvents.find(e => e === ev);
                if (eventToUpdate) {
                    eventToUpdate.title = newTitle.trim();
                    saveData(STORAGE_KEYS.EVENTS, allEvents);
                    renderPlanner();
                    updateDashboardWidgets();
                }
            }
        });

        const del = document.createElement('button');
        del.className = 'small-btn';
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
            if (!confirm('Delete this event?')) return;
            const idx = allEvents.findIndex(e => e === ev);
            if (idx > -1) {
                allEvents.splice(idx, 1);
                saveData(STORAGE_KEYS.EVENTS, allEvents);
                events = allEvents;
                renderPlanner();
                updateDashboardWidgets();
            }
        });

        controls.appendChild(edit);
        controls.appendChild(del);
        li.appendChild(controls);
        todaysList.appendChild(li);
    });

    // Add focus tasks
    const focusTasks = loadData(STORAGE_KEYS.FOCUS_TASKS);
    focusTasks.forEach((task, idx) => {
        const li = document.createElement('li');
        const titleSpan = document.createElement('span');
        titleSpan.textContent = task.title;
        li.appendChild(titleSpan);

        const controls = document.createElement('span');
        const edit = document.createElement('button');
        edit.className = 'small-btn';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => {
            const newTitle = prompt('Edit task title', task.title);
            if (newTitle !== null && newTitle.trim()) {
                const tasks = loadData(STORAGE_KEYS.FOCUS_TASKS);
                tasks[idx].title = newTitle.trim();
                saveData(STORAGE_KEYS.FOCUS_TASKS, tasks);
                renderFocusTasks();
                updateDashboardWidgets();
            }
        });

        const del = document.createElement('button');
        del.className = 'small-btn';
        del.textContent = 'Delete';
        del.addEventListener('click', () => {
            if (!confirm('Delete this focus task?')) return;
            const tasks = loadData(STORAGE_KEYS.FOCUS_TASKS);
            tasks.splice(idx, 1);
            saveData(STORAGE_KEYS.FOCUS_TASKS, tasks);
            renderFocusTasks();
            updateDashboardWidgets();
        });

        controls.appendChild(edit);
        controls.appendChild(del);
        li.appendChild(controls);
        todaysList.appendChild(li);
    });

    // Update global events variable
    events = loadData(STORAGE_KEYS.EVENTS);
}

/* --- Schedule Now functionality --- */
const scheduleNowBtn = document.getElementById('schedule-btn');
scheduleNowBtn.addEventListener('click', () => {
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7; // Convert to Monday=0 indexing
    const todayName = DAYS[todayIndex];
    const afternoonSlot = "14:00"; // 2:00 PM
    const endSlot = "15:30"; // 1.5 hour block

    // Check if slot is available
    const existing = events.find(ev => ev.day === todayName && ev.from === afternoonSlot);
    if (existing) {
        if (confirm('An event already exists at that slot. Replace it?')) {
            existing.title = 'Deep Work — Content Creation';
            existing.to = endSlot;
            existing.priority = 'high';
        }
    } else {
        events.push({
            day: todayName,
            from: afternoonSlot,
            to: endSlot,
            title: 'Deep Work — Content Creation',
            priority: 'high',
            frequency: 'once'
        });
    }
    saveData(STORAGE_KEYS.EVENTS, events);
    renderPlanner();
    updateDashboardWidgets();
});

/* --- Initialization --- */
(function init() {
    // Initialize with some sample data for demonstration
    if (loadData(STORAGE_KEYS.GOALS).length === 0) {
        saveData(STORAGE_KEYS.GOALS, [
            {
                title: 'Learn Web Development',
                steps: [
                    { title: 'Complete HTML basics', completed: true },
                    { title: 'Master CSS layouts', completed: true },
                    { title: 'Learn JavaScript fundamentals', completed: false },
                    { title: 'Build first project', completed: false }
                ],
                createdAt: Date.now()
            }
        ]);
    }

    if (loadData(STORAGE_KEYS.FOCUS_TASKS).length === 0) {
        saveData(STORAGE_KEYS.FOCUS_TASKS, [
            { title: 'Review morning emails' },
            { title: 'Complete project proposal' }
        ]);
    }

    if (loadData(STORAGE_KEYS.EVENTS).length === 0) {
        saveData(STORAGE_KEYS.EVENTS, [
            {
                title: 'Morning Standup',
                day: 'Monday',
                from: '09:00',
                to: '09:30',
                priority: 'high',
                frequency: 'weekly'
            },
            {
                title: 'Project Meeting',
                day: 'Monday',
                from: '09:10',
                to: '11:10',
                priority: 'high',
                frequency: 'once'
            },
            {
                title: 'Lunch Break',
                day: 'Tuesday',
                from: '12:00',
                to: '13:00',
                priority: 'medium',
                frequency: 'daily'
            }
        ]);
    }

    events = loadData(STORAGE_KEYS.EVENTS);
    renderGoals();
    renderFocusTasks();
    renderPlanner();
    updateDashboardWidgets();
})();
