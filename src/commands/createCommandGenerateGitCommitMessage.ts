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

            getCommitMessage(config, repo, context, channel).then((message) => {
                if (repo) {
                    repo.inputBox.value = message;
                }
            }).catch((err) => {
                vscode.window.showErrorMessage(err);
            });
        }
    );

    context.subscriptions.push(command1);
};
