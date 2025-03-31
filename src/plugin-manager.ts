import * as vscode from 'vscode';
import { Plugin } from '../plugins/types';

export class PluginManager {
    private plugins: Plugin[] = [];
    private outputChannel: vscode.OutputChannel;
    
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('RooBoost');
    }

    registerPlugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    activateAll(context: vscode.ExtensionContext) {
        this.plugins.forEach(plugin => {
            try {
                // Register all commands for the plugin
                if (plugin.commands) {
                    plugin.commands.forEach(cmd => {
                        const disposable = vscode.commands.registerCommand(
                            cmd.commandId,
                            (...args: any[]) => cmd.handler(context, ...args)
                        );
                        context.subscriptions.push(disposable);
                    });
                }
                
                plugin.outputChannel = this.outputChannel;
                plugin.activate(context, this.outputChannel);
            } catch (err) {
                this.outputChannel.appendLine(`Failed to activate plugin ${plugin.name}: ${err}`);
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