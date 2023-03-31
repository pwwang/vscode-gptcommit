// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import createCommandGenerateGitCommitMessage from './commands/createCommandGenerateGitCommitMessage';
import {
	setupOpenAIApiKey,
	useDifferentModel,
	setOutputLanguage,
	showPerFileSummary,
	disableConventionalCommit,
} from './commands/createCommandConfigs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	// console.log('Congratulations, your extension "gptcommit" is now active!');

	let channel = vscode.window.createOutputChannel('GPTCommit');
	context.subscriptions.push(channel);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	createCommandGenerateGitCommitMessage(context, channel);
	setupOpenAIApiKey(context, channel);
	useDifferentModel(context, channel);
	setOutputLanguage(context, channel);
	showPerFileSummary(context, channel);
	disableConventionalCommit(context, channel);
}

// This method is called when your extension is deactivated
export function deactivate() {}
