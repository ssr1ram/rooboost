import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getTasksDirectory } from './webview-panel';

interface Task {
    name: string;
    path: string;
    message: string;
    projectName: string;
    timestamp: number;
}

export async function loadTasks(panel: vscode.WebviewPanel, outputChannel: vscode.OutputChannel) {
    const tasksDir = getTasksDirectory();
    
    try {
        if (!fs.existsSync(tasksDir)) {
            throw new Error(`Directory does not exist: ${tasksDir}`);
        }

        fs.accessSync(tasksDir, fs.constants.R_OK);

        const taskDirs = fs.readdirSync(tasksDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const taskPath = path.join(tasksDir, dirent.name);
                let messageText = 'No message available';
                let projectName = 'Unknown project';
                
                try {
                    const messagesPath = path.join(taskPath, 'ui_messages.json');
                    if (fs.existsSync(messagesPath)) {
                        const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
                        if (messages[0]?.text) {
                            messageText = messages[0].text.substring(0, 120);
                            if (messages[0].text.length > 120) {
                                messageText += '...';
                            }
                        }
                    }

                    const historyPath = path.join(taskPath, 'api_conversation_history.json');
                    if (fs.existsSync(historyPath)) {
                        outputChannel.appendLine(`Found history file for ${dirent.name}`);
                        const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
                        if (history[0]?.content?.[1]?.text) {
                            outputChannel.appendLine(`Found content text for ${dirent.name}`);
                            const pathMatch = history[0].content[1].text.match(/Current Working Directory \((.*)\)/);
                            if (pathMatch && pathMatch[1]) {
                                outputChannel.appendLine(`Found path match for ${dirent.name}: ${pathMatch[1]}`);
                                const pathParts = pathMatch[1].split('/');
                                projectName = pathParts[pathParts.length - 1];
                                outputChannel.appendLine(`Extracted project name for ${dirent.name}: ${projectName}`);
                            } else {
                                outputChannel.appendLine(`No path match found in text for ${dirent.name}`);
                            }
                        } else {
                            outputChannel.appendLine(`No content text found for ${dirent.name}`);
                        }
                    } else {
                        outputChannel.appendLine(`No history file found for ${dirent.name}`);
                    }
                } catch (err) {
                    outputChannel.appendLine(`Error reading task files for ${dirent.name}: ${err}`);
                }
                outputChannel.appendLine(`Project: ${projectName}, Message: ${messageText}`);
                const stats = fs.statSync(taskPath);
                const taskObj = {
                    name: dirent.name.substring(0, 8), // Shorten task ID
                    path: taskPath,
                    message: messageText,
                    projectName: projectName,
                    timestamp: stats.mtimeMs
                };
                outputChannel.appendLine(`Created task object: ${JSON.stringify(taskObj)}`);
                return taskObj;
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Reverse chronological sort

        outputChannel.appendLine('Final task objects: ' + JSON.stringify(taskDirs, null, 2));
        outputChannel.show();

        const message = {
            command: 'showTasks',
            tasks: taskDirs,
            debug: `Successfully loaded ${taskDirs.length} tasks from ${tasksDir}`
        };
        panel.webview.postMessage(JSON.stringify(message));
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        panel.webview.postMessage({
            command: 'showError',
            message: `Could not load tasks: ${errorMsg}`,
            debug: `Failed to load tasks from ${tasksDir}`
        });
    }
}