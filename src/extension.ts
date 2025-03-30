import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

interface Task {
    name: string;
    path: string;
}

interface WebviewMessage {
    command: string;
    tasks?: Task[];
    message?: string;
    debug?: string;
}

let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('RooBoost Debug');
    outputChannel.show(true); // Show the output channel
    outputChannel.appendLine('RooBoost extension activated');
    outputChannel.appendLine(`Extension context: ${context.extensionPath}`);
    
    const browseTasksCommand = vscode.commands.registerCommand('rooboost.browseTasks', () => {
        outputChannel.appendLine('Browse Tasks command executed');
        createTaskBrowserPanel(context);
    });

    context.subscriptions.push(browseTasksCommand);
}

function createTaskBrowserPanel(context: vscode.ExtensionContext) {
    outputChannel.appendLine('Creating task browser panel');
    const panel = vscode.window.createWebviewPanel(
        'rooboostTaskBrowser',
        'RooBoost Task Browser',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getWebviewContent();
    outputChannel.appendLine('Webview HTML content set');

    panel.webview.onDidReceiveMessage(
        async (message: WebviewMessage) => {
            outputChannel.appendLine(`Received message from webview: ${JSON.stringify(message)}`);
            outputChannel.appendLine(`Message command: ${message.command}`);
            switch (message.command) {
                case 'loadTasks':
                    outputChannel.appendLine('Executing loadTasks command');
                    try {
                        await loadTasks(panel);
                        outputChannel.appendLine('loadTasks completed successfully');
                    } catch (err: unknown) {
                        const errorMsg = err instanceof Error ? err.message : String(err);
                        outputChannel.appendLine(`loadTasks failed: ${errorMsg}`);
                        throw err;
                    }
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

async function loadTasks(panel: vscode.WebviewPanel) {
    const tasksDir = getTasksDirectory();
    outputChannel.appendLine(`Loading tasks from directory: ${tasksDir}`);
    
    // Detailed directory debugging
    try {
        outputChannel.appendLine(`Directory exists: ${fs.existsSync(tasksDir)}`);
        if (fs.existsSync(tasksDir)) {
            outputChannel.appendLine(`Directory stats: ${JSON.stringify(fs.statSync(tasksDir))}`);
            outputChannel.appendLine(`Directory contents: ${fs.readdirSync(tasksDir).join(', ')}`);
        }
        fs.accessSync(tasksDir, fs.constants.R_OK);
        outputChannel.appendLine('Directory is readable');
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`Directory error: ${errorMsg}`);
        throw err;
    }

    try {
        // Verify directory exists
        if (!fs.existsSync(tasksDir)) {
            throw new Error(`Directory does not exist: ${tasksDir}`);
        }

        // Check directory permissions
        try {
            fs.accessSync(tasksDir, fs.constants.R_OK);
        } catch (err) {
            throw new Error(`No read permissions for directory: ${tasksDir}`);
        }

        const taskDirs = fs.readdirSync(tasksDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const taskPath = path.join(tasksDir, dirent.name);
                outputChannel.appendLine(`Found task directory: ${dirent.name} at ${taskPath}`);
                let messageText = 'No message available';
                try {
                    const messagesPath = path.join(taskPath, 'ui_messages.json');
                    if (fs.existsSync(messagesPath)) {
                        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                        if (messages[0]?.text) {
                            messageText = messages[0].text.substring(0, 120);
                            if (messages[0].text.length > 120) {
                                messageText += '...';
                            }
                        } else {
                            outputChannel.appendLine(`messages length ${messages.length}`)
                        }
                    } else {
                        outputChannel.appendLine(`No path ${messagesPath}`)
                    }
                } catch (err) {
                    outputChannel.appendLine(`Error reading ui_messages for ${dirent.name}: ${err}`);
                }

                return {
                    name: dirent.name,
                    path: taskPath,
                    message: messageText
                };
            });

        outputChannel.appendLine(`Found ${taskDirs.length} task directories: ${taskDirs.map(t => t.name).join(', ')}`);
        
        panel.webview.postMessage({
            command: 'showTasks',
            tasks: taskDirs,
            debug: `Successfully loaded ${taskDirs.length} tasks from ${tasksDir}`
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        outputChannel.appendLine(`Error loading tasks: ${errorMsg}`);
        
        panel.webview.postMessage({
            command: 'showError',
            message: `Could not load tasks: ${errorMsg}`,
            debug: `Failed to load tasks from ${tasksDir}`
        });
    }
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getWebviewContent(): string {
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
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
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
            
            console.log('Webview received message:', message);
            
            switch (message.command) {
                case 'showTasks':
                    console.log('Processing showTasks command');
                    const tasksList = document.getElementById('taskList');
                    if (tasksList) {
                        if (message.tasks && message.tasks.length > 0) {
                            const tasksHtml = message.tasks.map(task => {
                                // Abbreviate task ID (first 4 + last 4 chars)
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
                    console.log('Processing showError command');
                    const errorTaskList = document.getElementById('taskList');
                    if (errorTaskList && message.message) {
                        errorTaskList.innerHTML =
                            '<p class="error">' + message.message + '</p>';
                    }
                    if (debugInfo && message.debug) {
                        debugInfo.innerHTML += '<div>' + message.debug + '</div>';
                    }
                    break;
                default:
                    console.log('Unknown message command:', message.command);
                    if (debugInfo) {
                        debugInfo.innerHTML += '<div>Unknown command: ' + message.command + '</div>';
                    }
            }
        });

        // Load tasks initially
        loadTasks();
    </script>
</body>
</html>`;
}

function getTasksDirectory(): string {
    const platform = os.platform();
    if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks');
    } else if (platform === 'win32') {
        return path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks');
    } else {
        return path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks');
    }
}

export function deactivate() {
    outputChannel.appendLine('RooBoost extension deactivated');
    outputChannel.dispose();
}