import * as vscode from 'vscode';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { exec, execSync } from 'child_process';
import { GitExtension, Repository } from './@types/git';

export function getGitExtension() {
    const vscodeGit = vscode.extensions.getExtension<GitExtension>('vscode.git');
    const gitExtension = vscodeGit && vscodeGit.exports;
    return gitExtension && gitExtension.getAPI(1);
}

export async function getCommitMessage(
    config: vscode.WorkspaceConfiguration,
    repo: Repository,
    context: vscode.ExtensionContext,
    channel: vscode.OutputChannel
) {
	const gptcommit = config.gptcommitPath || "gptcommit";
	const uid = randomUUID();
	const tmpMsgFile = `${tmpdir()}/vscode-gptcommit-${uid}.txt`;
	const tmpDiffFile = `${tmpdir()}/vscode-gptcommit-${uid}.diff`;
	const onFiles = config.onFiles || 'tryStagedThenUnstaged';

    return vscode.window.withProgress({
        location: vscode.ProgressLocation.SourceControl,
        title: 'Generating commit message...',
        cancellable: false
    }, async (progress, token) => {
        let diff: string;
        if (onFiles === 'staged') {
            diff = await repo.diff(true);
        } else if (onFiles === 'unstaged') {
            diff = await repo.diff(false);
        } else {
            diff = await repo.diff(true);
            if (!diff) {
                diff = await repo.diff(false);
            }
        }
        writeFileSync(tmpDiffFile, diff);
        const cmd = `${gptcommit} prepare-commit-msg --commit-msg-file ${tmpMsgFile} --commit-source commit --git-diff-content ${tmpDiffFile}`;
        channel.appendLine(`COMMAND: ${cmd}`);
        return new Promise<string>((resolve, reject) => {
            exec(cmd, {
                cwd: repo.rootUri.path
            }, (err, stdout, stderr) => {
                channel.appendLine(`STDOUT: ${stdout}`);
                channel.appendLine(`STDERR: ${stderr}`);
                channel.show();
                try { unlinkSync(tmpDiffFile); } catch (e) {}
                if (err) {
                    try { unlinkSync(tmpMsgFile); } catch (e) {}
                    reject(err);
                } else if (/is being amended/.test(stdout)) {
                    // set allow-amend to true
                    const cmd = `${gptcommit} config set allow_amend true`;
                    channel.appendLine(`COMMAND: ${cmd}`);
                    execSync(cmd, {cwd: repo.rootUri.path});
                    // try again
                    getCommitMessage(config, repo, context, channel).then((msg) => {
                        resolve(msg);
                    }).catch((err) => {
                        reject(err);
                    });
                } else if (/OpenAI API key not found/.test(stdout)) {
                    reject('OpenAI API key not found, run "gptcommit.setupOpenAIApiKey" command to set it up');
                } else if (!existsSync(tmpMsgFile)) {
                    reject('Failed to generate commit message');
                } else if (config.expressMode) {
                    const msg = readFileSync(tmpMsgFile, 'utf8');
                    try { unlinkSync(tmpMsgFile); } catch (e) {}
                    resolve(polishMessage(msg, config.expressModeContent));
                } else {
                    const editor = vscode.window.activeTextEditor;
                    vscode.workspace.openTextDocument(tmpMsgFile).then(async (doc) => {
                        await vscode.window.showTextDocument(doc, {
                            preview: false,
                            viewColumn: editor ? editor.viewColumn : undefined,
                        });
                        progress.report({ increment: 100 });
                    });

                    let disposable = vscode.workspace.onDidSaveTextDocument(async (doc) => {
                        if (doc.fileName === tmpMsgFile) {
                            repo.inputBox.value = doc.getText();
                        }
                    });
                    context.subscriptions.push(disposable);
                }
            });
        });
    });
}

export function polishMessage(msg: string, content: string) {
	const lines = msg.split('\n');
	let title = lines[0];
	let body = [];
	let breakdown = [];
	let breakdownStarted = false;
	for (let line of lines.slice(1)) {
		if (line.startsWith('### BEGIN GIT COMMIT')) {
			break;
		}
		if (line.startsWith('[')) {
			breakdownStarted = true;
		}
		if (breakdownStarted) {
			breakdown.push(line);
		} else if (line.startsWith('- ')) {
			body.push(line);
		}
	}
	if (/breakdown/.test(content)) {
		breakdown = ['', ...breakdown];
	}
	if (content === 'title') {
		return title;
	}
	if (content === 'title + body') {
		return [title, '', ...body].join('\n');
	}
	if (content === 'title + breakdown') {
		return [title, ...breakdown].join('\n');
	}
	return [title, '', ...body, ...breakdown].join('\n');
}
