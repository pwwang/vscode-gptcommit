import * as vscode from 'vscode';
import * as path from 'path';
import { getRepo, saveConfig  } from '../utils';

export function setupOpenAIApiKey(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let apiCommand = vscode.commands.registerCommand('gptcommit.setupOpenAIApiKey', async (uri?: vscode.SourceControl) => {
        vscode.window.showInputBox({
            prompt: 'Enter your OpenAI API key',
            placeHolder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
            ignoreFocusOut: true,
        }).then((key) => {
            if (key) {
                saveConfig(
                    'openai.api_key',
                    'openai.api_key',
                    channel,
                    getRepo(uri),
                    key,
                    'Configuration openai.api_key saved'
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
            ignoreFocusOut: true,
        }).then((model) => {
            if (model) {
                saveConfig(
                    'openai.model',
                    'openai.model',
                    channel,
                    getRepo(uri),
                    model,
                    'Configuration openai.model saved'
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
            ignoreFocusOut: true,
        }).then((lang) => {
            if (lang) {
                saveConfig(
                    'output.lang',
                    'output.lang',
                    channel,
                    getRepo(uri),
                    lang,
                    'Configuration output.lang saved'
                );
            }
        });
    });

    context.subscriptions.push(languageCommand);
}

export function showPerFileSummary(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let showPerFileCommand = vscode.commands.registerCommand('gptcommit.showPerFileSummary', async (uri?: vscode.SourceControl) => {
        vscode.window.showQuickPick(
            ["Yes", "No"],
            {
                placeHolder: 'Enable "show per-file summary"?',
            }
        ).then((show) => {
            if (show === "Yes" || show === "No") {
                saveConfig(
                    'output.show_per_file_summary',
                    'output.show_per_file_summary',
                    channel,
                    getRepo(uri),
                    show === "Yes" ? "true" : "false",
                    'Configuration output.show_per_file_summary saved'
                );
            }
        });
    });

    context.subscriptions.push(showPerFileCommand);
}

export function disableConventionalCommit(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let disableConvCommitCommand = vscode.commands.registerCommand('gptcommit.disableConventionalCommit', async (uri?: vscode.SourceControl) => {
        vscode.window.showQuickPick(
            ["Yes", "No"],
            {
                placeHolder: 'Disable conventional commit?',
            }
        ).then((show) => {
            if (show === "Yes" || show === "No") {
                saveConfig(
                    'output.conventional_commit',
                    'output.conventional_commit',
                    channel,
                    getRepo(uri),
                    show === "Yes" ? "false" : "true",
                    'Configuration output.conventional_commit saved'
                );
            }
        });
    });

    context.subscriptions.push(disableConvCommitCommand);
}

export function openConfigFile(context: vscode.ExtensionContext, channel: vscode.OutputChannel) {
    let openConfigFileCommand = vscode.commands.registerCommand('gptcommit.openConfigFile', async (uri?: vscode.SourceControl) => {
        const repo = getRepo(uri);
        if (!repo) {
            return;
        }
        channel.appendLine(`Opening ${path.join(repo.rootUri.fsPath, ".git", "gptcommit.toml")}`);
        const editor = vscode.window.activeTextEditor;
        const doc = await vscode.workspace.openTextDocument(path.join(repo.rootUri.fsPath, ".git", "gptcommit.toml"));
        await vscode.window.showTextDocument(doc, {
            preview: false,
            viewColumn: editor ? editor.viewColumn : undefined,
        });
    });

    context.subscriptions.push(openConfigFileCommand);
}
