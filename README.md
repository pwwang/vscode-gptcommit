# vscode-gptcommit

Automated git commit messages using GPT models via [gptcommit][1] for VS Code.

![vscode-gptcommit][2]

## Installation

- Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=pwwang.gptcommit)
- Install the [gptcommit][1]

Note: Do NOT install `gptcommit` hook via `gptcommit install` under the root of your git repo.

## Commands

Run via `Ctrl+Shift+P` or `Cmd+Shift+P`:

- `GPTCommit: Generate Git Commit Message`
  Generate the commit message

- `GPTCommit: Setup OpenAI API Key`
  Setup the OpenAI API Key. You can get the API key from [OpenAI][3]

- `GPTCommit: Try a different OpenAI model`
  Try a different OpenAI model. For a list of public OpenAI models, checkout the [OpenAI docs][4].

## Extension Settings

- `ExpressMode`: If true, generated message will be filled into the Source Control commit message input box directly, instead of opening a new editor.
- `ExpressModeContent`: Content of the message to fill in the express mode.
- `GptcommitPath`: Path to the `gptcommit` executable.
- `OnFiles`: Diff of files to use for generating the commit message.
  - `staged`: Use staged files
  - `unstaged`: Use unstaged files
  - `tryStagedThenUnstaged`: Try staged files first, then try unstaged files if no staged files are found

## Advanced configuration

The configuration is saved at `~/.config/gptcommit/config.json`. You can edit it manually, but it's recommended to use commands inside VS Code to edit the configuration, unless you know what you are doing.

Also refer to the [gptcommit][1] documentation for more information.

[1]: https://github.com/zurawiki/gptcommit
[2]: https://raw.githubusercontent.com/pwwang/vscode-gptcommit/master/vscode-gptcommit.gif
[3]: https://openai.com/api/
[4]: https://beta.openai.com/docs/models/overview
