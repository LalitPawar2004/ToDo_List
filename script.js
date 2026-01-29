// DOM Elements
const taskInput = document.getElementById('taskInput');
const taskDate = document.getElementById('taskDate');
const taskTime = document.getElementById('taskTime');
const addTaskBtn = document.getElementById('addTaskBtn');
const pendingTasks = document.getElementById('pendingTasks');
const completedTasks = document.getElementById('completedTasks');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const themeToggle = document.getElementById('themeToggle');
const clearAllBtn = document.getElementById('clearAll');
const priorityBtns = document.querySelectorAll('.priority-btn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const currentYear = document.getElementById('currentYear');

// State Variables
let currentPriority = 'low';
let tasks = JSON.parse(localStorage.getItem('tasks')) || {
    pending: [],
    completed: []
};

// Initialize
function init() {
    // Set current year in footer
    currentYear.textContent = new Date().getFullYear();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    taskDate.value = today;
    
    // Set default time to next hour
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    const timeString = nextHour.getHours().toString().padStart(2, '0') + ':00';
    taskTime.value = timeString;
    
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    
    // Load tasks
    loadTasks();
    
    // Event Listeners
    setupEventListeners();
}

// Set up all event listeners
function setupEventListeners() {
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Priority buttons
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPriority = btn.dataset.priority;
        });
    });
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Clear all tasks
    clearAllBtn.addEventListener('click', clearAllTasks);
}

// Task Management Functions
function addTask() {
    const text = taskInput.value.trim();
    
    if (!text) {
        showNotification('Please enter a task description', 'error');
        taskInput.focus();
        return;
    }
    
    const task = {
        id: Date.now(),
        text: text,
        date: taskDate.value,
        time: taskTime.value,
        priority: currentPriority,
        createdAt: new Date().toISOString()
    };
    
    tasks.pending.push(task);
    saveTasks();
    renderTasks();
    
    // Reset input
    taskInput.value = '';
    taskInput.focus();
    
    showNotification('Task added successfully!', 'success');
}

function deleteTask(taskId, isCompleted = false) {
    if (isCompleted) {
        tasks.completed = tasks.completed.filter(task => task.id !== taskId);
    } else {
        tasks.pending = tasks.pending.filter(task => task.id !== taskId);
    }
    
    saveTasks();
    renderTasks();
    showNotification('Task deleted', 'info');
}

function completeTask(taskId) {
    const taskIndex = tasks.pending.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        const task = tasks.pending[taskIndex];
        task.completedAt = new Date().toISOString();
        tasks.completed.unshift(task); // Add to beginning
        tasks.pending.splice(taskIndex, 1);
        
        saveTasks();
        renderTasks();
        showNotification('Task completed! 🎉', 'success');
    }
}

function editTask(taskId) {
    const taskIndex = tasks.pending.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
        const task = tasks.pending[taskIndex];
        
        // Populate form with task data
        taskInput.value = task.text;
        taskDate.value = task.date;
        taskTime.value = task.time;
        
        // Set priority
        priorityBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.priority === task.priority) {
                btn.classList.add('active');
                currentPriority = task.priority;
            }
        });
        
        // Delete the task (will be re-added when user saves)
        tasks.pending.splice(taskIndex, 1);
        saveTasks();
        renderTasks();
        
        taskInput.focus();
        showNotification('Edit your task and click "Add Task" to save', 'info');
    }
}

function clearAllTasks() {
    if (tasks.pending.length === 0 && tasks.completed.length === 0) {
        showNotification('No tasks to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear all tasks? This cannot be undone.')) {
        tasks = { pending: [], completed: [] };
        saveTasks();
        renderTasks();
        showNotification('All tasks cleared', 'info');
    }
}

// UI Rendering Functions
function renderTasks() {
    // Clear current lists
    pendingTasks.innerHTML = '';
    completedTasks.innerHTML = '';
    
    // Render pending tasks
    if (tasks.pending.length === 0) {
        pendingTasks.innerHTML = `
            <div class="empty-state">
                <i class="far fa-check-circle"></i>
                <p>No pending tasks. Add one above!</p>
            </div>
        `;
    } else {
        tasks.pending.forEach(task => {
            pendingTasks.appendChild(createTaskElement(task, false));
        });
    }
    
    // Render completed tasks
    if (tasks.completed.length === 0) {
        completedTasks.innerHTML = `
            <div class="empty-state">
                <i class="far fa-star"></i>
                <p>No completed tasks yet.</p>
            </div>
        `;
    } else {
        tasks.completed.forEach(task => {
            completedTasks.appendChild(createTaskElement(task, true));
        });
    }
    
    // Update counters
    pendingCount.textContent = tasks.pending.length;
    completedCount.textContent = tasks.completed.length;
}

function createTaskElement(task, isCompleted) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-item ${task.priority} ${isCompleted ? 'completed' : ''}`;
    taskEl.dataset.id = task.id;
    
    const dateTime = task.date ? 
        `${formatDate(task.date)} ${task.time ? '• ' + task.time : ''}` : 
        'No date set';
    
    const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    
    taskEl.innerHTML = `
        <div class="task-content">
            <div class="task-text">${escapeHtml(task.text)}</div>
            <div class="task-meta">
                <span><i class="far fa-calendar"></i> ${dateTime}</span>
                <span class="task-priority priority-${task.priority}">
                    <i class="fas fa-flag"></i> ${priorityText}
                </span>
            </div>
        </div>
        <div class="task-actions">
            ${!isCompleted ? `
                <button class="task-btn complete-btn" title="Mark as Complete">
                    <i class="fas fa-check"></i>
                </button>
                <button class="task-btn edit-btn" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
            ` : ''}
            <button class="task-btn delete-btn" title="Delete Task">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    // Add event listeners to buttons
    if (!isCompleted) {
        taskEl.querySelector('.complete-btn').addEventListener('click', () => completeTask(task.id));
        taskEl.querySelector('.edit-btn').addEventListener('click', () => editTask(task.id));
    }
    
    taskEl.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id, isCompleted));
    
    return taskEl;
}

// Theme Functions
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    updateThemeButton(newTheme);
    showNotification(`Switched to ${newTheme} theme`, 'info');
}

function updateThemeButton(theme) {
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    notificationText.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        notification.style.background = 'var(--danger-color)';
    } else if (type === 'success') {
        notification.style.background = 'var(--success-color)';
    } else {
        notification.style.background = 'var(--primary-color)';
    }
    
    // Show notification
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Storage Functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);