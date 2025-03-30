import * as vscode from 'vscode';

export interface Plugin {
    name: string;
    version: string;
    commands: Command[];
    activate(context: vscode.ExtensionContext): void;
    deactivate(): void;
}

export interface Command {
    commandId: string;
    title: string;
    handler: (context: vscode.ExtensionContext, ...args: any[]) => void;
}