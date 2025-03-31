import * as vscode from 'vscode';
import { createTaskBrowserPanel } from './webview-panel';
import { Plugin, Command } from '../types';

export class BrowseTasksPlugin implements Plugin {
    name = "Browse Tasks";
    version = "1.0.0";
    outputChannel?: vscode.OutputChannel;
    
    commands: Command[] = [
        {
            commandId: 'rooboost.browseTasks',
            title: 'Browse Tasks',
            handler: this.activate.bind(this)
        },
        {
            commandId: 'rooboost.viewTask',
            title: 'View Task',
            handler: this.viewTask.bind(this)
        }
    ];

    private panel?: vscode.WebviewPanel;

    activate(context: vscode.ExtensionContext) {
        if (!this.panel) {
            this.panel = createTaskBrowserPanel(context, this.outputChannel!);
        }
        this.panel.reveal(vscode.ViewColumn.One);
    }

    private async viewTask(context: vscode.ExtensionContext, ...args: any[]) {
        try {
            const taskPath = args[0];
            if (typeof taskPath !== 'string') {
                throw new Error('Invalid task path');
            }
            const uri = vscode.Uri.file(taskPath);
            await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open task: ${error}`);
        }
    }

    deactivate() {
        this.panel?.dispose();
    }
}

export default BrowseTasksPlugin;