import * as vscode from 'vscode';
import { PluginManager } from './plugin-manager';
import BrowseTasksPlugin from '../plugins/browse-tasks';
import { Plugin } from '../plugins/types';

let pluginManager: PluginManager;
let context: vscode.ExtensionContext;

export function activate(extensionContext: vscode.ExtensionContext) {
    context = extensionContext;
    pluginManager = new PluginManager();
    
    // Register core plugins
    pluginManager.registerPlugin(new BrowseTasksPlugin());
    
    // Activate all plugins
    pluginManager.activateAll(context);

    // Register external plugin loading command
    context.subscriptions.push(
        vscode.commands.registerCommand('rooboost.loadExternalPlugin', loadExternalPlugin)
    );
}

async function loadExternalPlugin() {
    try {
        const fileUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: { 'JavaScript/TypeScript': ['js', 'ts'] }
        });

        if (!fileUri || fileUri.length === 0) return;

        const pluginPath = fileUri[0].fsPath;
        const pluginModule = require(pluginPath);

        if (!pluginModule.default || !isValidPlugin(pluginModule.default)) {
            throw new Error('Selected file does not export a valid Plugin');
        }

        const plugin = new pluginModule.default();
        pluginManager.registerPlugin(plugin);
        pluginManager.activateAll(context);
        
        vscode.window.showInformationMessage(`Plugin ${plugin.name} loaded successfully`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to load plugin: ${errorMessage}`);
    }
}

function isValidPlugin(plugin: any): plugin is Plugin {
    return plugin &&
        typeof plugin.name === 'string' &&
        typeof plugin.version === 'string' &&
        Array.isArray(plugin.commands) &&
        typeof plugin.activate === 'function' &&
        typeof plugin.deactivate === 'function';
}

export function deactivate() {
    pluginManager?.deactivateAll();
}