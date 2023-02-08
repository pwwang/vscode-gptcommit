import * as vscode from 'vscode';
import { getGitExtension, getCommitMessage } from '../utils';
import { Repository } from '../@types/git';

export default (context: vscode.ExtensionContext) => {
    let command1 = vscode.commands.registerCommand(
        'gptcommit.generateGitCommitMessage',
        async (uri?: vscode.SourceControl) => {
            // The code you place here will be executed every time your command is executed
            // Display a message box to the user
            const git = getGitExtension();

            if (!git) {
                vscode.window.showErrorMessage('Git extension not found');
                return;
            }

            const config = vscode.workspace.getConfiguration('gptcommit');

            let repo: Repository | undefined;
            if (uri) {
                const uriPath = uri.rootUri?.path;
                repo = git.repositories.find(r => r.rootUri.path === uriPath);
            } else if (git.repositories.length === 1) {
                repo = git.repositories[0];
            } else if (git.repositories.length > 1) {
                repo = git.repositories[0];
                vscode.window.showWarningMessage('Multiple repositories found, using first one');
            } else {
                vscode.window.showErrorMessage('No repository found');
                return;
            }
            if (!repo) {
                vscode.window.showErrorMessage('No repository found');
                return;
            }

            getCommitMessage(config, repo, context).then((message) => {
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
