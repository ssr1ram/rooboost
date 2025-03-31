import * as vscode from 'vscode';

export interface Plugin {
    name: string;
    version: string;
    commands: Command[];
    outputChannel?: vscode.OutputChannel;
    activate(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel): void;
    deactivate(): void;
}

export interface Command {
    commandId: string;
    title: string;
    handler: (context: vscode.ExtensionContext, ...args: any[]) => void;
}