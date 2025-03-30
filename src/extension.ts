import * as vscode from 'vscode';
import { PluginManager } from './plugin-manager';
import BrowseTasksPlugin from '../plugins/browse-tasks';

let pluginManager: PluginManager;

export function activate(context: vscode.ExtensionContext) {
    pluginManager = new PluginManager();
    
    // Register core plugins
    pluginManager.registerPlugin(new BrowseTasksPlugin());
    
    // Activate all plugins
    pluginManager.activateAll(context);
}

export function deactivate() {
    pluginManager?.deactivateAll();
}