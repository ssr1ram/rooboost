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
        console.log('Webview script initializing...');
        try {
            const vscode = acquireVsCodeApi();
            console.log('VS Code API acquired successfully');
        
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

        function safeStringify(obj) {
            try {
                return JSON.stringify(obj);
            } catch {
                return '{}';
            }
        }

        console.log('Setting up message listener...');
        window.addEventListener('message', event => {
            console.log('Message event received:', event);
            const debugInfo = document.getElementById('debugInfo');
            
            try {
                if (!event || !event.data) {
                    if (debugInfo) {
                        debugInfo.innerHTML += '<div class="error">No event data received</div>';
                    }
                    return;
                }
                
                // Safely parse message
                let message;
                try {
                    message = typeof event.data === 'string' ?
                        JSON.parse(event.data) : event.data;
                } catch (parseError) {
                    console.error('Error parsing message:', parseError);
                    if (debugInfo) {
                        debugInfo.innerHTML += '<div class="error">Invalid message format: ' +
                            escapeHtml(parseError.message) + '</div>';
                    }
                    return;
                }
                
                if (!message || !message.command) {
                    if (debugInfo) {
                        debugInfo.innerHTML += '<div class="error">Message missing command</div>';
                    }
                    return;
                }

                // Log raw message to debug panel
                if (debugInfo) {
                    debugInfo.innerHTML += '<div class="debug-message">' +
                        escapeHtml(safeStringify(message)) + '</div>';
                }

                switch (message.command) {
                    case 'showTasks':
                        const tasksList = document.getElementById('taskList');
                        if (tasksList) {
                            if (Array.isArray(message.tasks) && message.tasks.length > 0) {
                                // Validate tasks array
                                if (!Array.isArray(message.tasks)) {
                                    throw new Error('Tasks is not an array');
                                }

                                // Generate safe HTML with validation
                                const tasksHtml = message.tasks.map(task => {
                                    try {
                                        if (!task || typeof task !== 'object') {
                                            console.warn('Invalid task object:', task);
                                            return '';
                                        }
                                        
                                        // Validate required fields
                                        const taskId = typeof task.name === 'string' ? task.name : '';
                                        const taskMessage = typeof task.message === 'string' ? task.message : '';
                                        
                                        const shortId = taskId.length > 8 ?
                                            taskId.substring(0,4) + '...' + taskId.substring(taskId.length-4) :
                                            taskId;
                                        
                                        const safeHtml = '<li class="task-item">' +
                                            '<div class="task-id">' + escapeHtml(shortId) + '</div>' +
                                            '<div class="task-message">' + escapeHtml(taskMessage) + '</div>' +
                                            '</li>';
                                            
                                        console.log('Generated task HTML:', safeHtml);
                                        return safeHtml;
                                    } catch (error) {
                                        console.error('Error generating task HTML:', error, task);
                                        return '';
                                    }
                                }).join('');
                                
                                // Validate final HTML before injection
                                try {
                                    const fullHtml = '<ul class="task-list">' + tasksHtml + '</ul>';
                                    console.log('Full tasks HTML:', fullHtml);
                                    tasksList.innerHTML = fullHtml;
                                } catch (error) {
                                    console.error('Error setting tasks HTML:', error);
                                    tasksList.innerHTML = '<p class="error">Error displaying tasks</p>';
                                }
                            } else {
                                tasksList.innerHTML = '<p>No tasks found</p>';
                            }
                        }
                        if (debugInfo && message.debug) {
                            debugInfo.innerHTML += '<div>' + escapeHtml(message.debug) + '</div>';
                        }
                        break;
                    case 'showError':
                        const errorTaskList = document.getElementById('taskList');
                        if (errorTaskList) {
                            errorTaskList.innerHTML = message.message ?
                                '<p class="error">' + escapeHtml(message.message) + '</p>' :
                                '<p class="error">An unknown error occurred</p>';
                        }
                        if (debugInfo && message.debug) {
                            debugInfo.innerHTML += '<div>' + escapeHtml(message.debug) + '</div>';
                        }
                        break;
                }
            } catch (error) {
                console.error('Error processing message:', error);
                const errorTaskList = document.getElementById('taskList');
                if (errorTaskList) {
                    errorTaskList.innerHTML = '<p class="error">Error displaying content</p>';
                }
            }
        });

        loadTasks();
    </script>
</body>
</html>`;
}