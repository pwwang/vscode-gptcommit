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
            }).catch((err) => {
                vscode.window.showErrorMessage(err, "Show Output").then((choice) => {
                    if (choice === "Show Output") {
                        channel.show();
                    }
                });
            }).finally(() => {
                vscode.commands.executeCommand('setContext', 'gptcommit.generating', false);
            });
        }
    );

    context.subscriptions.push(command1);
};
