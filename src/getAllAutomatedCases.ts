import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { FileUtil } from './fileUtil';
import * as assert from "assert";
import { Assembler } from './assembler';

export async function getAllAutomatedCases() {
    return vscode.commands.registerCommand('scripting.getAllAutomatedCases', async () => {
        const editor = vscode.window.activeTextEditor;
        assert(editor, "Please focus to the editor!");

        vscode.window.showInformationMessage("Get all automated cases?", { modal: true }, { title: 'Yes' }).then(async (answer) => {
            if (answer?.title != "Yes") {
                vscode.window.showInformationMessage("Canceled~");
                return;
            }
            await execute();
        });

        async function execute() {
            const editor = vscode.window.activeTextEditor;
            assert(editor, "Please focus to the editor!");

            await Configuration.prepareConfiguration({
                prepareTestItEndpoint: true,
                prepareInheritingFolder: true,
                prepareCasePrefix: true
            });

            // get your project's folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath)[0];
            assert(!!workspaceFolder, "Not a valid workspace folder!");

            const fileList = FileUtil.getFileListWithFileNamePattern(workspaceFolder, Configuration.configuration.caseFileNameEnding);
            const caseIdsAlongWithPriority: { id: string; priority: string; }[] = await FileUtil.getCaseIdsAlongWithPriorityFromFileList({ fileList: fileList, casePrefix: Configuration.configuration.casePrefix })
            const content = Assembler.assembleAutomatedCasesContent({ allCaseIdsAlongWithPriority: caseIdsAlongWithPriority });

            const snippet: vscode.SnippetString = new vscode.SnippetString(content);
            editor.insertSnippet(snippet);
        }
    });
}