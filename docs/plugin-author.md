# Plugin Author Guide

## Plugin Basics

Plugins extend the functionality of the Rooboost extension by implementing the `Plugin` interface. Each plugin:

1. Must implement the required interface
2. Is registered during extension activation
3. Has its own lifecycle (activation/deactivation)

## Creating a Plugin

1. Create a new TypeScript file in the `plugins/` directory
2. Implement the `Plugin` interface from `../plugins/types`
3. Export your plugin class as default

```typescript
import { Plugin, Command } from '../types';
import * as vscode from 'vscode';

export default class MyPlugin implements Plugin {
    // Implementation here
}
```

## Plugin Structure

### Required Properties
- `name`: string - Display name of your plugin
- `version`: string - Semantic version (e.g., "1.0.0")

### Commands
Array of `Command` objects with:
- `commandId`: string - Unique command identifier (prefix with 'rooboost.')
- `title`: string - Display name shown in command palette
- `handler`: function - Called when command is executed

### Lifecycle Methods
- `activate(context: vscode.ExtensionContext)`: Called when plugin is activated
- `deactivate()`: Called when extension is deactivated

## Example Implementation

```typescript
import { Plugin, Command } from '../types';
import * as vscode from 'vscode';

export default class HelloWorldPlugin implements Plugin {
    name = "Hello World";
    version = "1.0.0";
    
    commands: Command[] = [{
        commandId: 'rooboost.helloWorld',
        title: 'Say Hello',
        handler: this.activate.bind(this)
    }];

    activate(context: vscode.ExtensionContext) {
        vscode.window.showInformationMessage('Hello World!');
    }

    deactivate() {
        // Clean up resources if needed
    }
}
```

## Best Practices

1. **Error Handling**:
   - Wrap plugin activation in try/catch
   - Handle errors gracefully

2. **Command Naming**:
   - Prefix command IDs with 'rooboost.'
   - Use consistent naming (e.g., 'rooboost.myPlugin.command')

3. **Resource Management**:
   - Dispose of resources in deactivate()
   - Register disposables with the extension context

4. **Webviews**:
   - Use the `createWebviewPanel` API for complex UIs
   - Follow VS Code webview best practices