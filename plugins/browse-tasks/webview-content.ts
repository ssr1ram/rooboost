export function getWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RooBoost Task Browser</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 200px;
            background-color: #f3f3f3;
            border-right: 1px solid #ddd;
            padding: 10px;
        }
        .menu-item {
            padding: 8px;
            cursor: pointer;
            border-radius: 4px;
            margin-bottom: 4px;
        }
        .menu-item:hover {
            background-color: #e0e0e0;
        }
        .menu-item.selected {
            background-color: #0078d4;
            color: white;
        }
        .content {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
        }
        .task-list {
            list-style: none;
            padding: 0;
        }
        .task-item {
            padding: 8px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
        }
        .task-item:hover {
            background-color: #f5f5f5;
        }
        .error {
            color: #f44336;
        }
        .debug {
            color: #666;
            font-size: 0.8em;
            margin-top: 20px;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="menu-item selected" onclick="loadTasks()">Browse Tasks</div>
    </div>
    <div class="content" id="content">
        <h2>Browse Tasks</h2>
        <div id="taskList">Loading tasks...</div>
        <div id="debugInfo" class="debug"></div>
    </div>
    <script>
        console.log('Webview script initializing at ' + new Date().toISOString());
        const vscode = acquireVsCodeApi();
        console.log('VS Code API acquired successfully');
        
    function loadTasks() {
        console.log('loadTasks called at ' + new Date().toISOString());
        document.getElementById('taskList').innerHTML = 'Loading tasks...';
        vscode.postMessage({ command: 'loadTasks' });
    }
    
    console.log('Setting up message listener...');
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
                const tasksHtml = message.tasks.map(task => 
                    '<li class="task-item">' + task.name + '</li>'
                ).join('');
                taskList.innerHTML = '<ul class="task-list">' + tasksHtml + '</ul>';
                console.log('Tasks rendered to UI');
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
    
    console.log('Script setup complete');
    loadTasks();
</script>
</body>
</html>`;
}