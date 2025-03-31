import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { getWebviewContent } from './webview-content';
import { loadTasks } from './task-loader';

interface Task {
    name: string;
    path: string;
    message: string;
}

export function createTaskBrowserPanel(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): vscode.WebviewPanel {
    const panel = vscode.window.createWebviewPanel(
        'rooboostTaskBrowser',
        'RooBoost Task Browser',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'plugins', 'browse-tasks'))
            ]
        }
    );

    panel.webview.html = getWebviewContent();

    interface WebviewMessage {
        command: string;
        taskPath?: string;
        source?: string;
        plugin?: string;
    }

    panel.webview.onDidReceiveMessage(
        async (message: WebviewMessage) => {
            switch (message.command) {
                case 'loadTasks':
                    outputChannel.appendLine('Received loadTasks command');
                    await loadTasks(panel, outputChannel, 'rooveterinaryinc.roo-cline');
                    break;
                case 'selectSource':
                    outputChannel.appendLine(`Received selectSource command for: ${message.source}`);
                    await loadTasks(panel, outputChannel, message.source);
                    break;
                case 'viewTask':
                    outputChannel.appendLine(`Received viewTask command for path: ${message.taskPath}`);
                    if (message.taskPath) {
                        try {
                            await vscode.commands.executeCommand('rooboost.viewTask', message.taskPath);
                        } catch (err) {
                            outputChannel.appendLine(`Failed to execute viewTask: ${err}`);
                        }
                    }
                    break;
                case 'pluginChanged':
                    outputChannel.appendLine(`Plugin changed to: ${message.plugin}`);
                    // Handle plugin switching logic here
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    return panel;
}

export function getTasksDirectory(source: string = 'rooveterinaryinc.roo-cline'): string {
    const platform = os.platform();
    const baseDirs = {
        darwin: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage'),
        win32: path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage'),
        linux: path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage')
    };
    
    const baseDir = platform === 'win32' ? baseDirs.win32 :
                    platform === 'darwin' ? baseDirs.darwin :
                    baseDirs.linux;
    
    return path.join(baseDir, source, 'tasks');
}