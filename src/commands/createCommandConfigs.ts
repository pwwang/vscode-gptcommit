import * as vscode from 'vscode';
import { getRepo, saveConfig  } from '../utils';

export function setupOpenAIApiKey(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let apiCommand = vscode.commands.registerCommand('gptcommit.setupOpenAIApiKey', async (uri?: vscode.SourceControl) => {
        vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            placeHolder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        }).then((key) => {
            if (key) {
                saveConfig(
                    'openai.api_key',
                    'openai.api_key',
                    channel,
                    getRepo(uri),
                    key,
                    'OpenAI API key saved'
                );
            }
        });
    });

    context.subscriptions.push(apiCommand);
};

export function useDifferentModel(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let modelCommand = vscode.commands.registerCommand('gptcommit.useDifferentModel', async (uri?: vscode.SourceControl) => {
        vscode.window.showInputBox({
            prompt: 'Enter the model you want to use',
            placeHolder: 'gpt-3.5-turbo',
        }).then((model) => {
            if (model) {
                saveConfig(
                    'openai.model',
                    'openai.model',
                    channel,
                    getRepo(uri),
                    model,
                    'Model saved'
                );
            }
        });
    });

    context.subscriptions.push(modelCommand);
}

export function setOutputLanguage(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let languageCommand = vscode.commands.registerCommand('gptcommit.setOutputLanguage', async (uri?: vscode.SourceControl) => {
        vscode.window.showInputBox({
            prompt: 'Enter the language of the generated commit message',
            placeHolder: 'en',
        }).then((lang) => {
            if (lang) {
                saveConfig(
                    'output.lang',
                    'output.lang',
                    channel,
                    getRepo(uri),
                    lang,
                    'Output language saved'
                );
            }
        });
    });

    context.subscriptions.push(languageCommand);
}
