# Hello World Plugin for RooBoost

This documentation explains how to create and load external plugins for the RooBoost VSCode extension.

## Plugin Requirements
To create a valid plugin, you must:
1. Implement the `Plugin` interface from `rooboost/plugins/types`
2. Export your plugin class as default
3. Bundle your plugin as a CommonJS module

## Example Plugin
```typescript
import * as vscode from 'vscode';
import { Plugin, Command } from 'rooboost/plugins/types';

export default class HelloWorldPlugin implements Plugin {
    name = "Hello World";
    version = "1.0.0";
    outputChannel?: vscode.OutputChannel;
    
    commands: Command[] = [
        {
            commandId: 'helloWorld.sayHello',
            title: 'Say Hello',
            handler: () => vscode.window.showInformationMessage('Hello from external plugin!')
        }
    ];

    activate(context: vscode.ExtensionContext) {
        this.outputChannel?.appendLine('HelloWorldPlugin activated');
    }

    deactivate() {
        this.outputChannel?.appendLine('HelloWorldPlugin deactivated');
    }
}
```

## Loading External Plugins
1. Open the Command Palette (Ctrl+Shift+P)
2. Run "RooBoost: Load External Plugin"
3. Select the plugin's main JavaScript/TypeScript file
4. The plugin will be loaded and activated immediately

## Troubleshooting
- **Plugin not loading**: Ensure your plugin implements all required interface methods
- **Commands not appearing**: Check your command IDs are unique
- **Activation errors**: Verify your plugin doesn't throw during activation