// DOM Elements
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const dueDateInput = document.getElementById('dueDateInput');
const prioritySelect = document.getElementById('prioritySelect');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const progressBar = document.getElementById('progressBar');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const darkModeToggle = document.getElementById('darkModeToggle');
const sortSelect = document.getElementById('sortSelect');

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let totalTasks = 0;
let completedTasks = 0;
let flatpickrInstance;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initializeFlatpickr();
    loadTasks();
    if (localStorage.getItem('darkMode') === 'true') {
        toggleDarkMode();
    }
});

// Event Listeners
addTaskBtn.addEventListener('click', addTask);
clearCompletedBtn.addEventListener('click', clearCompletedTasks);
darkModeToggle.addEventListener('click', toggleDarkMode);
sortSelect.addEventListener('change', sortTasks);

// Check for overdue tasks every minute
setInterval(checkOverdueTasks, 60000);

// Core Functions
function addTask() {
    const text = taskInput.value.trim();
    const category = categorySelect.value;
    const dueDate = flatpickrInstance.selectedDates[0];
    const priority = prioritySelect.value;

    if (text) {
        const newTask = { 
            id: Date.now(),
            text, 
            category, 
            dueDate, 
            priority, 
            completed: false 
        };
        tasks.push(newTask);
        renderTask(newTask);
        
        resetInputFields();
        updateStats();
        saveTasks();
        sortTasks();
    }
}

function toggleComplete(task, taskElement) {
    task.completed = !task.completed;
    updateTaskElement(task, taskElement);
    updateStats();
    saveTasks();
}

function deleteTask(task, taskElement) {
    taskElement.classList.add('removing');
    setTimeout(() => {
        const index = tasks.findIndex(t => t.id === task.id);
        if (index > -1) {
            tasks.splice(index, 1);
            taskElement.remove();
            updateStats();
            saveTasks();
        }
    }, 300);
}

// Helper Functions
function updateStats() {
    totalTasks = tasks.length;
    completedTasks = tasks.filter(task => task.completed).length;
    totalTasksSpan.textContent = totalTasks;
    completedTasksSpan.textContent = completedTasks;
    const progress = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
    progressBar.style.width = `${progress}%`;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    taskList.innerHTML = '';
    tasks.forEach(renderTask);
    updateStats();
}

function renderTask(task) {
    const taskElement = createTaskElement(task);
    taskList.appendChild(taskElement);
    setTimeout(() => {
        taskElement.style.opacity = '1';
        taskElement.style.transform = 'translateY(0)';
    }, 10);
}

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    loadTasks();
    saveTasks();
}

function resetInputFields() {
    taskInput.value = '';
    categorySelect.value = 'personal';
    flatpickrInstance.clear();
    prioritySelect.value = 'low';
}

function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.classList.add('task-item');
    taskItem.dataset.taskId = task.id;
    taskItem.style.opacity = '0';
    taskItem.style.transform = 'translateY(20px)';
    taskItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    if (task.completed) taskItem.classList.add('completed');
    if (task.dueDate && new Date(task.dueDate) < new Date()) taskItem.classList.add('overdue');

    taskItem.innerHTML = `
        <div class="task-info">
            <span class="priority-indicator priority-${task.priority}"></span>
            <span>${task.text}</span>
            <span class="category">${task.category}</span>
            <span class="due-date">${task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
            <span class="status">${task.completed ? 'Completed' : 'Pending'}</span>
        </div>
        <div class="task-actions">
            <button class="complete-btn" id="complete-btn-${task.id}"><i class="fas fa-check"></i></button>
            <button class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;

    const completeBtn = taskItem.querySelector('.complete-btn');
    const deleteBtn = taskItem.querySelector('.delete-btn');

    completeBtn.addEventListener('click', () => toggleComplete(task, taskItem));
    deleteBtn.addEventListener('click', () => deleteTask(task, taskItem));

    return taskItem;
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    };
    return new Date(dateString).toLocaleString(undefined, options);
}

function updateTaskElement(task, taskElement) {
    taskElement.classList.toggle('completed', task.completed);
    const statusSpan = taskElement.querySelector('.status');
    statusSpan.textContent = task.completed ? 'Completed' : 'Pending';
    
    if (task.completed) {
        triggerCelebration();
    }
    
    if (!task.completed && task.dueDate && new Date(task.dueDate) < new Date()) {
        taskElement.classList.add('overdue');
    } else {
        taskElement.classList.remove('overdue');
    }
}

function triggerCelebration() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 1000
    });
}

function initializeFlatpickr() {
    flatpickrInstance = flatpickr("#dueDateInput", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today"
    });
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    darkModeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        darkModeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        darkModeToggle.style.transform = 'rotate(0deg)';
    }, 250);
}

function sortTasks() {
    const sortBy = sortSelect.value;
    tasks.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (sortBy === 'dueDate') {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }
        return 0;
    });
    
    taskList.innerHTML = '';
    tasks.forEach(renderTask);
}

function checkOverdueTasks() {
    const now = new Date();
    tasks.forEach((task, index) => {
        if (!task.completed && task.dueDate && new Date(task.dueDate) < now) {
            const taskElement = taskList.children[index];
            if (taskElement && !taskElement.classList.contains('overdue')) {
                taskElement.classList.add('overdue');
                taskElement.style.animation = 'none';
                taskElement.offsetHeight;
                taskElement.style.animation = null;
            }
        }
    });
}


