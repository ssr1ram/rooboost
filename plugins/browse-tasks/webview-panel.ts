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

    const webviewContent = getWebviewContent();
    console.log('Webview content length:', webviewContent.length);
    panel.webview.html = webviewContent;
    
    // Log webview configuration
    console.log('Webview options:', {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'plugins', 'browse-tasks'))
        ]
    });
    
    panel.webview.onDidReceiveMessage(
        async (message: { command: string; taskPath?: string }) => {
            switch (message.command) {
                case 'loadTasks':
                    outputChannel.appendLine('Received loadTasks command');
                    await loadTasks(panel, outputChannel);
                    break;
                case 'viewTask':
                    outputChannel.appendLine(`Received viewTask command for path: ${message.taskPath}`);
                    if (message.taskPath) {
                        try {
                            await vscode.commands.executeCommand('rooboost.viewTask', message.taskPath);
                            outputChannel.appendLine('Successfully executed viewTask command');
                        } catch (err) {
                            const error = err as Error;
                            outputChannel.appendLine(`Failed to execute viewTask: ${error.message}`);
                        }
                    } else {
                        outputChannel.appendLine('Error: No taskPath provided in viewTask command');
                    }
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    return panel;
}

export function getTasksDirectory(): string {
    const platform = os.platform();
    if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks');
    } else if (platform === 'win32') {
        return path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks');
    } else {
        return path.join(os.homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks');
    }
}