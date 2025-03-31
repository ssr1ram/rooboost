import * as vscode from 'vscode';
import { Plugin, Command } from './types';

export default class HelloWorldPlugin implements Plugin {
    name = "Hello World";
    version = "1.0.0";
    outputChannel?: vscode.OutputChannel;
    
    commands: Command[] = [
        {
            commandId: 'helloWorld.sayHello',
            title: 'Say Hello',
            handler: () => vscode.window.showInformationMessage('Hello from external plugin!')
        },
        {
            commandId: 'helloWorld.showOutput',
            title: 'Show Output',
            handler: () => this.outputChannel?.show()
        }
    ];

    activate(context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('HelloWorld');
        this.outputChannel.appendLine('HelloWorldPlugin activated');
    }

    deactivate() {
        this.outputChannel?.appendLine('HelloWorldPlugin deactivated');
        this.outputChannel?.dispose();
    }
}