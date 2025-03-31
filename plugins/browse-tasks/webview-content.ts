import * as path from 'path';
import * as fs from 'fs';

export function getWebviewContent(): string {
    const thisFileDir = __dirname;
    const htmlPath = path.join(thisFileDir, 'website-content.html');
    const cssPath = path.join(thisFileDir, 'website-content.css');
    const jsPath = path.join(thisFileDir, 'website-content.js');

    try {
        let html = fs.readFileSync(htmlPath, 'utf-8');
        const css = fs.readFileSync(cssPath, 'utf-8');
        const js = fs.readFileSync(jsPath, 'utf-8');

        // Replace external references with inlined content
        html = html.replace('<!-- CSS_PLACEHOLDER -->', `<style>${css}</style>`);
        html = html.replace('<!-- JS_PLACEHOLDER -->', `<script>${js}</script>`);
        
        return html;
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