import * as path from 'path';
import * as fs from 'fs';

export function getWebviewContent(): string {
    // Get the directory where this source file is located
    const thisFileDir = __dirname;
    
    // Path to the HTML file in the same directory
    const htmlPath = path.join(thisFileDir, 'website-content.html');
    
    try {
        // Read the HTML file synchronously
        return fs.readFileSync(htmlPath, 'utf-8');
    } catch (error) {
        console.error('Failed to load webview content:', error);
        return getFallbackHtmlContent();
    }
}

function getFallbackHtmlContent(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>RooBoost</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .error { color: red; }
    </style>
</head>
<body>
    <h1 class="error">Error Loading Content</h1>
    <p>Failed to load the webview content. Please check the extension logs.</p>
</body>
</html>`;
}