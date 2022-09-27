import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { API } from './api';
import * as assert from "assert";
import { CaseHelper } from './caseHelper';
import { Assembler } from './assembler';

export async function replaceKeyInfoForCase() {
    return vscode.commands.registerCommand('scripting.replaceKeyInfoForCase', async () => {
        const editor = vscode.window.activeTextEditor;
        assert(editor, "Please focus to the editor!");

        vscode.window.showInformationMessage("Replace key info for case?", { modal: true }, { title: 'Yes' }).then(async (answer) => {
            if (answer?.title != "Yes") {
                vscode.window.showInformationMessage("Canceled~");
                return;
            }
            await execute();
        });

        async function execute() {
            const editor = vscode.window.activeTextEditor;
            assert(editor, "Please focus to the editor!");

            await Configuration.prepareConfiguration({ prepareTestItEndpoint: true });

            const caseId = CaseHelper.getCaseIdFromFile(editor.document.fileName);
            assert(!!caseId, "The caseId is not ok, please check current file name!");

            const caseData = await API.getCaseKeyInfo(caseId);
            const content = Assembler.assembleContentForReplacingCaseKeyInfo({ caseData: caseData });

            const snippet: vscode.SnippetString = new vscode.SnippetString(content);
            editor.insertSnippet(snippet);
        }
    });
}