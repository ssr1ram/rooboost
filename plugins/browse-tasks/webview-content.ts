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
        const vscode = acquireVsCodeApi();
        
        function escapeHtml(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "<")
                .replace(/>/g, ">")
                .replace(/"/g, """)
                .replace(/'/g, "&#039;");
        }
        
        function loadTasks() {
            document.getElementById('taskList').innerHTML = 'Loading tasks...';
            document.getElementById('debugInfo').innerHTML = '';
            vscode.postMessage({
                command: 'loadTasks'
            });
        }

        window.addEventListener('message', event => {
            const message = event.data;
            const debugInfo = document.getElementById('debugInfo');
            
            switch (message.command) {
                case 'showTasks':
                    const tasksList = document.getElementById('taskList');
                    if (tasksList) {
                        if (message.tasks && message.tasks.length > 0) {
                            const tasksHtml = message.tasks.map(task => {
                                const taskId = task.name;
                                const shortId = taskId.length > 8 ?
                                    taskId.substring(0,4) + '...' + taskId.substring(taskId.length-4) :
                                    taskId;
                                
                                return '<li class="task-item">' +
                                    '<div class="task-id">' + escapeHtml(shortId) + '</div>' +
                                    '<div class="task-message">' + escapeHtml(task.message) + '</div>' +
                                    '</li>';
                            }).join('');
                            
                            tasksList.innerHTML = '<ul class="task-list">' + tasksHtml + '</ul>';
                        } else {
                            tasksList.innerHTML = '<p>No tasks found</p>';
                        }
                    }
                    if (debugInfo && message.debug) {
                        debugInfo.innerHTML += '<div>' + message.debug + '</div>';
                    }
                    break;
                case 'showError':
                    const errorTaskList = document.getElementById('taskList');
                    if (errorTaskList && message.message) {
                        errorTaskList.innerHTML =
                            '<p class="error">' + message.message + '</p>';
                    }
                    if (debugInfo && message.debug) {
                        debugInfo.innerHTML += '<div>' + message.debug + '</div>';
                    }
                    break;
            }
        });

        loadTasks();
    </script>
</body>
</html>`;
}