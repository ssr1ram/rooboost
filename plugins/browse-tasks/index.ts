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
        this.panel = createTaskBrowserPanel(context);
    }

    deactivate() {
        this.panel?.dispose();
    }
}

export default BrowseTasksPlugin;