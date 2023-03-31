import * as vscode from 'vscode';
import { getCommitMessage } from '../utils';
import { getRepo } from '../utils';

export default (context: vscode.ExtensionContext, channel: vscode.OutputChannel) => {
    let command1 = vscode.commands.registerCommand(
        'gptcommit.generateGitCommitMessage',
        async (uri?: vscode.SourceControl) => {
            const repo = getRepo(uri);
            if (!repo) {
                return;
            }

            const config = vscode.workspace.getConfiguration('gptcommit');
            vscode.commands.executeCommand('setContext', 'gptcommit.generating', true);
            getCommitMessage(config, repo, context, channel).then((message) => {
                if (repo) {
                    repo.inputBox.value = message;
                }
                vscode.commands.executeCommand('setContext', 'gptcommit.generating', false);
            }).catch((err) => {
                vscode.window.showErrorMessage(err);
                vscode.commands.executeCommand('setContext', 'gptcommit.generating', false);
                channel.show();
            });
        }
    );

    context.subscriptions.push(command1);
};
