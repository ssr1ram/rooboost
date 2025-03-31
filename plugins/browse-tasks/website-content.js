console.log('Webview script initializing at ' + new Date().toISOString());
const vscode = acquireVsCodeApi();
console.log('VS Code API acquired successfully');

function loadTasks() {
    console.log('loadTasks called at ' + new Date().toISOString());
    document.getElementById('taskList').innerHTML = '<span class="loading">Loading tasks...</span>';
    vscode.postMessage({ command: 'loadTasks' });
}

function createViewLink(taskPath) {
    if (!taskPath) {
        console.error('Cannot create view link - taskPath is undefined');
        return '';
    }
    console.log("Creating view link for path:", taskPath);
    const escapedPath = taskPath.replace(/'/g, "\\'");
    return `<a class="action-link" onclick="viewTaskDetails('${escapedPath}')">View</a>`;
}

function viewTaskDetails(taskPath) {
    if (!taskPath) {
        console.error('Cannot view task - path is undefined');
        return;
    }
    console.log('Preparing to view task at path:', taskPath);
    const message = {
        command: 'viewTask',
        taskPath: taskPath
    };
    console.log('Posting message to VS Code:', JSON.stringify(message));
    try {
        vscode.postMessage(message);
    } catch (err) {
        console.error('Failed to post message:', err);
    }
}

console.log('Setting up message listener...');
let allTasks = [];
const projectFilter = document.getElementById('projectFilter');

function updateProjectFilterOptions(tasks) {
    const projects = new Set();
    tasks.forEach(task => projects.add(task.projectName || 'Unknown project'));
    
    // Clear existing options except "All Projects"
    while (projectFilter.options.length > 1) {
        projectFilter.remove(1);
    }

    // Convert Set to array and sort alphabetically (case-insensitive)
    const sortedProjects = Array.from(projects).sort((a, b) =>
        a.localeCompare(b, undefined, {sensitivity: 'base'}));

    // Add new options
    sortedProjects.forEach(project => {
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
                    <th style="width: 20px;"><input type="checkbox" id="headerCheckbox"></th>
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

window.addEventListener('message', event => {
    console.log('Message received at ' + new Date().toISOString() + ':', event.data);
    const taskList = document.getElementById('taskList');
    const debugInfo = document.getElementById('debugInfo');
    console.log('taskList element:', taskList ? 'found' : 'null');
    
    let message;
    try {
        message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        console.log('Parsed message:', message);
    } catch (e) {
        console.log('Failed to parse message:', e);
        return;
    }
    
    console.log('Command check:', message.command);
    
    if (message.command === 'showTasks') {
        console.log('Processing showTasks command with ' + (message.tasks ? message.tasks.length : 0) + ' tasks');
        
        if (Array.isArray(message.tasks) && message.tasks.length > 0) {
            allTasks = message.tasks;
            updateProjectFilterOptions(allTasks);
            
            const filteredTasks = filterTasks(allTasks, projectFilter.value);
            const tasksHtml = renderTasks(filteredTasks);
            taskList.innerHTML = tasksHtml;
            console.log('Tasks rendered to UI');
            // Setup bulk selection after allowing DOM to update
            setTimeout(() => {
                setupBulkSelection();
            }, 0);
        } else {
            taskList.innerHTML = '<p>No tasks found</p>';
            console.log('No tasks to render');
        }
    } else {
        console.log('Unknown command received');
    }
    
    if (debugInfo && message.debug) {
        debugInfo.innerHTML = 'Debug: ' + message.debug;
    }
});

// Set up action select change handler
document.getElementById('actionSelect').addEventListener('change', (event) => {
    const selectedAction = event.target.value;
    if (selectedAction === 'browseTasks') {
        loadTasks();
    }
});

// Source selection handler
document.querySelectorAll('.source-item').forEach(item => {
    item.addEventListener('click', () => {
        // Update selected state
        document.querySelectorAll('.source-item').forEach(i =>
            i.classList.remove('selected'));
        item.classList.add('selected');
        
        // Get the source from data attribute
        const source = item.dataset.source;
        console.log('Source selected:', source);
        
        // Send message to extension
        vscode.postMessage({
            command: 'selectSource',
            source: source
        });
    });
});

// Project filter change handler
projectFilter.addEventListener('change', () => {
    const filteredTasks = filterTasks(allTasks, projectFilter.value);
    document.getElementById('taskList').innerHTML = renderTasks(filteredTasks);
});

// Bulk selection functionality
function setupBulkSelection() {
    console.log('Setting up bulk selection...');
    
    // First verify the table exists and is accessible
    const taskTable = document.querySelector('.task-table');
    if (!taskTable) {
        console.debug('Task table not yet accessible - skipping bulk selection setup');
        return;
    }

    const actionBar = document.querySelector('.action-bar');
    const headerCheckbox = document.getElementById('headerCheckbox');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const moveToSource = document.getElementById('moveToSource');
    const moveSelectedBtn = document.getElementById('moveSelectedBtn');
    const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

    if (!actionBar || !headerCheckbox || !selectAllCheckbox || !moveToSource || !moveSelectedBtn || !deleteSelectedBtn) {
        console.debug('Some bulk selection elements not found - skipping setup');
        return;
    }

    console.log('All bulk selection elements found and accessible, proceeding with setup');

    function getSelectedTaskPaths() {
        const checkboxes = document.querySelectorAll('.task-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.dataset.taskPath);
    }

    // Task checkbox change handler
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            // Update header checkbox state
            const allChecked = document.querySelectorAll('.task-checkbox').length ===
                             document.querySelectorAll('.task-checkbox:checked').length;
            headerCheckbox.checked = allChecked;
            selectAllCheckbox.checked = allChecked;
        }
    });

    // Header checkbox click handler
    headerCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        selectAllCheckbox.checked = e.target.checked;
    });

    // Select All checkbox click handler
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
        headerCheckbox.checked = e.target.checked;
    });

    // Move selected button handler
    moveSelectedBtn.addEventListener('click', () => {
        const selectedPaths = getSelectedTaskPaths();
        const targetSource = moveToSource.value;
        
        if (selectedPaths.length === 0) {
            console.log('No tasks selected to move');
            return;
        }
        
        if (!targetSource) {
            console.log('No target source selected');
            return;
        }
        
        console.log('Moving tasks to source:', targetSource);
        vscode.postMessage({
            command: 'moveTasks',
            taskPaths: selectedPaths,
            targetSource: targetSource
        });
    });

    // Delete selected button handler
    deleteSelectedBtn.addEventListener('click', () => {
        const selectedPaths = getSelectedTaskPaths();
        
        if (selectedPaths.length === 0) {
            console.log('No tasks selected to delete');
            return;
        }
        
        console.log('Deleting selected tasks');
        vscode.postMessage({
            command: 'deleteTasks',
            taskPaths: selectedPaths
        });
    });
}

// Initial load
loadTasks();
setupBulkSelection();