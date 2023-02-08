// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import createCommandGenerateGitCommitMessage from './commands/createCommandGenerateGitCommitMessage';
import setupOpenAIApiKey from './commands/setupOpenAIApiKey';
import tryDifferentOpenAIModel from './commands/tryDifferentOpenAIModel';

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

	let command2 = vscode.commands.registerCommand('gptcommit.setupOpenAIApiKey', setupOpenAIApiKey);
	context.subscriptions.push(command2);

	let command3 = vscode.commands.registerCommand('gptcommit.tryDifferentOpenAIModel', tryDifferentOpenAIModel);
	context.subscriptions.push(command3);
}

// This method is called when your extension is deactivated
export function deactivate() {}
