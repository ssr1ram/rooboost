const vscode = acquireVsCodeApi();
let allTasks = [];

// Initialize plugin system
let currentPlugin = 'browseTasks';
const pluginContainers = {};

// Original browse tasks functionality
function loadTasks() {
    document.getElementById('taskList').innerHTML = '<span class="loading">Loading tasks...</span>';
    vscode.postMessage({ command: 'loadTasks' });
}

function createViewLink(taskPath) {
    if (!taskPath) return '';
    const escapedPath = taskPath.replace(/'/g, "\\'");
    return `<a class="action-link" onclick="viewTaskDetails('${escapedPath}')">View</a>`;
}

function viewTaskDetails(taskPath) {
    if (!taskPath) return;
    vscode.postMessage({
        command: 'viewTask',
        taskPath: taskPath
    });
}

function updateProjectFilterOptions(tasks) {
    const projectFilter = document.getElementById('projectFilter');
    const projects = new Set();
    tasks.forEach(task => projects.add(task.projectName || 'Unknown project'));
    
    while (projectFilter.options.length > 1) {
        projectFilter.remove(1);
    }

    Array.from(projects).sort((a, b) =>
        a.localeCompare(b, undefined, {sensitivity: 'base'}))
        .forEach(project => {
            const option = document.createElement('option');
            option.value = project;
            option.textContent = project;
            projectFilter.appendChild(option);
        });
}

function filterTasks(tasks, project) {
    if (project === 'all') return tasks;
    return tasks.filter(task => task.projectName === project);
}

function renderTasks(tasks) {
    if (!tasks || tasks.length === 0) {
        return '<p>No tasks found</p>';
    }

    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return `
        <table class="task-table">
            <thead>
                <tr>
                    <th><input type="checkbox" id="headerCheckbox"></th>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(task => `
                    <tr>
                        <td><input type="checkbox" class="task-checkbox" data-task-path="${task.path}"></td>
                        <td>${task.projectName || '-'}
                            <br>
                            <span class="small">${new Date(task.timestamp).toLocaleDateString("en-US", options)}</span>
                        </td>
                        <td>${task.message || '-'}</td>
                        <td>${createViewLink(task.path)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function setupBulkSelection() {
    const headerCheckbox = document.getElementById('headerCheckbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const moveToSource = document.getElementById('moveToSource');
    const moveSelectedBtn = document.getElementById('moveSelectedBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    function getSelectedTaskPaths() {
        const checkboxes = document.querySelectorAll('.task-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.dataset.taskPath);
    }

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const allChecked = document.querySelectorAll('.task-checkbox').length ===
                             document.querySelectorAll('.task-checkbox:checked').length;
            headerCheckbox.checked = allChecked;
            selectAllCheckbox.checked = allChecked;
        }
    });

    headerCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        selectAllCheckbox.checked = e.target.checked;
    });

    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        headerCheckbox.checked = e.target.checked;
    });

    moveSelectedBtn.addEventListener('click', () => {
        const selectedPaths = getSelectedTaskPaths();
        const targetSource = moveToSource.value;
        
        if (selectedPaths.length === 0 || !targetSource) return;
        
        vscode.postMessage({
            command: 'moveTasks',
            taskPaths: selectedPaths,
            targetSource: targetSource
        });
    });

    deleteSelectedBtn.addEventListener('click', () => {
        const selectedPaths = getSelectedTaskPaths();
        if (selectedPaths.length === 0) return;
        
        vscode.postMessage({
            command: 'deleteTasks',
            taskPaths: selectedPaths
        });
    });
}

// Initialize plugins
function initializePlugins() {
    pluginContainers.browseTasks = document.getElementById('browse-tasks-container');
    Object.values(pluginContainers).forEach(container => {
        if (container) container.style.display = 'none';
    });
    if (pluginContainers[currentPlugin]) {
        pluginContainers[currentPlugin].style.display = 'block';
    }
}

// Message handler
window.addEventListener('message', event => {
    const message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    
    if (message.command === 'showTasks') {
        if (Array.isArray(message.tasks) && message.tasks.length > 0) {
            allTasks = message.tasks;
            updateProjectFilterOptions(allTasks);
            const filteredTasks = filterTasks(allTasks, document.getElementById('projectFilter').value);
            document.getElementById('taskList').innerHTML = renderTasks(filteredTasks);
            setTimeout(() => setupBulkSelection(), 0);
        } else {
            document.getElementById('taskList').innerHTML = '<p>No tasks found</p>';
        }
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializePlugins();
    if (currentPlugin === 'browseTasks') {
        loadTasks();
    }
});

// Project filter change handler
document.getElementById('projectFilter').addEventListener('change', () => {
    const filteredTasks = filterTasks(allTasks, document.getElementById('projectFilter').value);
    document.getElementById('taskList').innerHTML = renderTasks(filteredTasks);
});