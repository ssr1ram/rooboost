import * as path from 'path';
import * as fs from 'fs';

export function getWebviewContent(): string {
    const thisFileDir = __dirname;
    const topbarPath = path.join(thisFileDir, '../common-topbar.html');
    const cssCommonPath = path.join(thisFileDir, '../common.css');
    const contentPath = path.join(thisFileDir, 'browse-tasks-content.html');
    const cssPagePath = path.join(thisFileDir, 'website-content.css');
    const jsPath = path.join(thisFileDir, 'website-content.js');

    try {
        const topbarHtml = fs.readFileSync(topbarPath, 'utf-8');
        const contentHtml = fs.readFileSync(contentPath, 'utf-8');
        const cssCommon = fs.readFileSync(cssCommonPath, 'utf-8');
        const cssPage = fs.readFileSync(cssPagePath, 'utf-8');
        const js = fs.readFileSync(jsPath, 'utf-8');

        // Extract body content from both files
        // const topbarBody = extractBodyContent(topbarHtml);
        // const contentBody = extractBodyContent(contentHtml);

        // Combine the content
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RooBoost</title>
    <link href="https://unpkg.com/@vscode/codicons/dist/codicon.css" rel="stylesheet" />
    <style>
        ${cssCommon}
        ${cssPage}
    </style>
</head>
<body>
    ${topbarHtml}
    ${contentHtml}
    <script>${js}</script>
</body>
</html>`;
    } catch (error) {
        console.error('Failed to load webview content:', error);
        return getFallbackHtmlContent();
    }
}

function extractBodyContent(html: string): string {
    const bodyStart = html.indexOf('<body>');
    const bodyEnd = html.indexOf('</body>');
    if (bodyStart === -1 || bodyEnd === -1) return '';
    return html.substring(bodyStart + 6, bodyEnd).trim();
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