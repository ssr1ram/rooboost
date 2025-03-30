import * as vscode from 'vscode';
import { Plugin } from '../plugins/types';

export class PluginManager {
    private plugins: Plugin[] = [];
    
    registerPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    activateAll(context: vscode.ExtensionContext) {
        this.plugins.forEach(plugin => {
            try {
                plugin.activate(context);
            } catch (err) {
                console.error(`Failed to activate plugin ${plugin.name}:`, err);
            }
        });
    }

    deactivateAll() {
        this.plugins.forEach(plugin => {
            try {
                plugin.deactivate();
            } catch (err) {
                console.error(`Failed to deactivate plugin ${plugin.name}:`, err);
            }
        });
    }
}