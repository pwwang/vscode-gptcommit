import { exec } from 'child_process';
import * as vscode from 'vscode';

export default async () => {
    vscode.window.showInputBox({
        prompt: 'Enter your OpenAI API key',
        placeHolder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    }).then((key) => {
        if (key) {
            // save key
            const gptcommit = vscode.workspace.getConfiguration('gptcommit').gptcommitPath || 'gptcommit';
            const cmd = `${gptcommit} config set openai.api_key ${key}`;
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to set OpenAI API key: ${err}`);
                } else {
                    vscode.window.showInformationMessage('OpenAI API key saved');
                }
            });
        }
    });
};
