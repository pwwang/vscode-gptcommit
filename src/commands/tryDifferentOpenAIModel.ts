import { exec } from 'child_process';
import * as vscode from 'vscode';

export default async () => {
    vscode.window.showInputBox({
        prompt: 'Try a different OpenAI model',
        placeHolder: 'e.g. text-davinci-003 See: https://beta.openai.com/docs/models/overview',
    }).then((model) => {
        if (model) {
            // save key
            const gptcommit = vscode.workspace.getConfiguration('gptcommit').gptcommitPath || 'gptcommit';
            const cmd = `${gptcommit} config set openai.model ${model}`;
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Failed to switch the model: ${err}`);
                } else {
                    vscode.window.showInformationMessage('New model configuration saved');
                }
            });
        }
    });
};
