import { commands, ExtensionContext, Uri } from 'vscode';
import { Constants } from './constants';
import prompts from './ext/prompts';
import { formatFiles } from './ext/commands/format-files';
import { validateInWorkspace } from './ext/commands/validate-in-workspace';
import { Config } from './ext/utilities/config';
import { FileQueryApi } from './ext/queries/file-query-api';
import { Git } from './ext/utilities/git';

export function activate(context: ExtensionContext): void {
  registerCommand(context, Constants.formatFiles, formatFilesInWorkspace);
  registerCommand(context, Constants.formatFilesFolder, formatFilesInWorkspace);
  registerCommand(context, Constants.formatFilesFromGlob, fromGlob);
  registerCommand(context, Constants.formatFilesFromGitChanges, fromGitChanges);
}

function registerCommand(context: ExtensionContext, command: string, callback: any): void {
  context.subscriptions.push(commands.registerCommand(command, callback));
}

async function formatFilesInWorkspace(inFolder?: Uri): Promise<void> {
  try {
    Config.load();
    validateInWorkspace();
    const workspaceFolder = await prompts.selectWorkspaceFolder(inFolder);
    const files = await FileQueryApi.getWorkspaceFiles(workspaceFolder, inFolder);
    await formatFiles(files);
  } catch (error) {}
}

async function fromGlob(): Promise<void> {
  try {
    Config.load();
    validateInWorkspace();
    const workspaceFolder = await prompts.selectWorkspaceFolder();
    const glob = await prompts.requestGlob();
    const useDefaultExcludes = await prompts.useDefaultExcludes();
    const files = await FileQueryApi.getWorkspaceFilesWithGlob(workspaceFolder, { glob, useDefaultExcludes });
    await formatFiles(files);
  } catch (error) {}
}

async function fromGitChanges(): Promise<void> {
  try {
    const git = new Git();
    const files = (await git.getGitChangedFiles()).map((file) => Uri.file(file));
    await formatFiles(files);
  } catch (error) {}
}
