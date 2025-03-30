import * as vscode from 'vscode';
import { createTaskBrowserPanel } from './webview-panel';
import { Plugin, Command } from '../types';

export class BrowseTasksPlugin implements Plugin {
    name = "Browse Tasks";
    version = "1.0.0";
    
    commands: Command[] = [{
        commandId: 'rooboost.browseTasks',
        title: 'Browse Tasks',
        handler: this.activate.bind(this)
    }];

    private panel?: vscode.WebviewPanel;

    activate(context: vscode.ExtensionContext) {
        if (!this.panel) {
            this.panel = createTaskBrowserPanel(context);
        }
        this.panel.reveal(vscode.ViewColumn.One);
    }

    deactivate() {
        this.panel?.dispose();
    }
}

export default BrowseTasksPlugin;