import * as vscode from 'vscode';
import * as path from 'path';
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
	const tmpMsgFile = path.join(tmpdir(), `vscode-gptcommit-${uid}.txt`);
	const tmpDiffFile = path.join(tmpdir(), `vscode-gptcommit-${uid}.diff`);
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
        // if diff is empty, return the promise here
        if (!diff) {
            return Promise.reject('No changes to commit');
        }
        writeFileSync(tmpDiffFile, diff);
        const cmd = `${gptcommit} prepare-commit-msg --commit-msg-file ${tmpMsgFile} --commit-source commit --git-diff-content ${tmpDiffFile}`;
        channel.appendLine(`COMMAND: ${cmd}`);
        return new Promise<string>((resolve, reject) => {
            exec(cmd, {
                cwd: repo.rootUri.fsPath
            }, (err, stdout, stderr) => {
                channel.appendLine(`STDOUT: ${stdout}`);
                channel.appendLine(`STDERR: ${stderr}`);
                try { unlinkSync(tmpDiffFile); } catch (e) {}

                if (/: not found\s*$/.test(stderr)) {
                    if (config.debug) {
                        channel.appendLine('DEBUG: gptcommit not found');
                    }
                    reject('gptcommit not found, see https://github.com/zurawiki/gptcommit. If it is not in your PATH, set "gptcommit.gptcommitPath" in your settings to the path to gptcommit');
                } else if (/OpenAI API key not found/.test(stderr)) {
                    if (config.debug) {
                        channel.appendLine('DEBUG: OpenAI API key not set');
                    }
                    reject('OpenAI API key not found, run "gptcommit.setupOpenAIApiKey" command to set it up');
                } else if (/is being amended/.test(stdout)) {
                    if (config.debug) {
                        channel.appendLine('DEBUG: allow_amend is false');
                    }
                    // set allow-amend to true
                    const cmd = `${gptcommit} config set --local allow_amend true`;
                    channel.appendLine(`COMMAND: ${cmd}`);
                    execSync(cmd, {cwd: repo.rootUri.fsPath});
                    // try again
                    getCommitMessage(config, repo, context, channel).then((msg) => {
                        resolve(msg);
                    }).catch((err) => {
                        reject(err);
                    });
                } else if (err || stderr) {
                    if (config.debug) {
                        channel.appendLine(`DEBUG: gptcommit failed with error: ${err} | ${stderr}`);
                    }
                    try { unlinkSync(tmpMsgFile); } catch (e) {}
                    reject(err || stderr);
                } else if (!existsSync(tmpMsgFile)) {
                    if (config.debug) {
                        channel.appendLine('DEBUG: gptcommit failed to generate commit message, message file not generated');
                    }
                    reject('Failed to generate commit message');
                } else if (config.expressMode) {
                    if (config.debug) {
                        channel.appendLine('DEBUG: express mode enabled, skipping editor');
                    }
                    const msg = readFileSync(tmpMsgFile, 'utf8');
                    try { unlinkSync(tmpMsgFile); } catch (e) {}
                    resolve(polishMessage(msg, config.expressModeContent));
                } else {
                    if (config.debug) {
                        channel.appendLine('DEBUG: opening editor');
                    }
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
	let summary = [];
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
			summary.push(line);
		}
	}
	if (/breakdown/.test(content)) {
		breakdown = ['', ...breakdown];
	}
	if (content === 'title') {
		return title;
	}
	if (content === 'title + summary') {
		return [title, '', ...summary].join('\n');
	}
	if (content === 'title + breakdown') {
		return [title, ...breakdown].join('\n');
	}
	return [title, '', ...summary, ...breakdown].join('\n');
}

export function getRepo(uri?: vscode.SourceControl): Repository | undefined {
    const git = getGitExtension();

    if (!git) {
        vscode.window.showErrorMessage('Git extension not found');
        return undefined;
    }

    if (uri) {
        const uriPath = uri.rootUri?.path;
        return git.repositories.find(r => r.rootUri.path === uriPath);
    }
    if (git.repositories.length === 1) {
        return git.repositories[0];
    }
    if (git.repositories.length > 1) {
        vscode.window.showWarningMessage('Multiple repositories found, using first one');
        return git.repositories[0];
    }
    vscode.window.showErrorMessage('No repository found');
    return undefined;
}

export function saveConfig(
    key: string,
    gckey: string,
    channel: vscode.OutputChannel,
    repo: Repository | undefined,
    value: any | undefined = undefined,
    savedInfo: string | undefined = undefined,
) {
    if (repo === undefined) {
        return;
    }
    const gptcommit = vscode.workspace.getConfiguration('gptcommit').gptcommitPath || 'gptcommit';
    if (value === undefined) {
        value = vscode.workspace.getConfiguration('gptcommit')[key];
    }
    const cmd = `${gptcommit} config set --local ${gckey} ${value}`;
    exec(cmd, { cwd: repo.rootUri.fsPath }, (err, stdout, stderr) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to save "${key}": ${err}`);
            channel.appendLine(`COMMAND: ${cmd}`);
            channel.appendLine(`STDOUT: ${stdout}`);
            channel.appendLine(`STDERR: ${stderr}`);
            exec("pwd", (err, stdout, stderr) => {
                vscode.window.showErrorMessage(`pwd: ${stdout} ${stderr} ${err}`)
            });
        } else if (savedInfo !== undefined) {
            vscode.window.showInformationMessage(savedInfo);
        }
    });
}
