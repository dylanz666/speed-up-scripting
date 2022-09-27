import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { API } from './api';
import { FileUtil } from './fileUtil';
import * as assert from "assert";
import axios from 'axios';
import { Assembler } from './assembler';

export async function getNotMarkedAsAutomatedCases() {
    return vscode.commands.registerCommand('scripting.getNotMarkedAsAutomatedCases', async () => {
        const editor = vscode.window.activeTextEditor;
        assert(editor, "Please focus to the editor!");

        vscode.window.showInformationMessage("Get not marked as automated cases?", { modal: true }, { title: 'Yes' }).then(async (answer) => {
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
                prepareCasePrefix: true,
                prepareBatchRequestSize: true
            });

            // get your project's folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath)[0];
            assert(!!workspaceFolder, "Not a valid workspace folder!");

            const fileList = FileUtil.getFileListWithFileNamePattern(workspaceFolder, Configuration.configuration.caseFileNameEnding);
            const caseIds: string[] = await FileUtil.getCaseIdsFromFileList({ fileList: fileList, casePrefix: Configuration.configuration.casePrefix });

            vscode.window.withProgress({
                cancellable: false,
                location: vscode.ProgressLocation.Notification,
                title: "Get not marked automated cases",
            }, async (progress) => {
                progress.report({ increment: 0 });
                const notMarkedAutomatedCases = await computeNotMarkedAutomatedCases({ caseIds: caseIds, progress });
                const content: string = Assembler.assembleContentFromNotMarkedAutomatedCases({ notMarkedAutomatedCases: notMarkedAutomatedCases });

                const snippet: vscode.SnippetString = new vscode.SnippetString(content);
                editor.insertSnippet(snippet);
                return;
            });
        }
    });
}

export async function computeNotMarkedAutomatedCases(params: {
    caseIds: string[],
    progress: vscode.Progress<{ message?: string; increment?: number }>
}) {
    let pms = [];
    let caseGroupIndex = 0;
    let computedCases: string[] = [];
    let notMarkedAutomatedCases: { caseId: string, executionTypeId: number }[] = [];
    let batchQuantity = 0;
    let computedQuantity = 0;
    let index = 0;
    for (let caseId of params.caseIds) {
        index += 1;
        batchQuantity += 1;
        computedQuantity += 1;
        computedCases.push(caseId);
        // prepare batch request: do 20 request a time
        caseGroupIndex += 1;
        if (caseGroupIndex <= Configuration.configuration.batchRequestSize) {
            pms.push(API.getCaseInfo(caseId));
        }
        if (caseGroupIndex == Configuration.configuration.batchRequestSize || index == params.caseIds.length - 1) {
            // do batch request
            let batchData = await axios.all(pms);

            caseGroupIndex = 0;
            // check automated or not
            for (let data of batchData) {
                // executionType 1 is: automated
                if (data.executionType != 1) {
                    notMarkedAutomatedCases.push({
                        caseId: `${data.prefix}-${data.externalId}`,
                        executionTypeId: data.executionType
                    });
                }
            }
            params.progress.report({ message: `${computedQuantity} of ${params.caseIds.length} cases are computed~`, increment: (batchQuantity / params.caseIds.length) * 100 });
            batchQuantity = 0;
            pms = [];
        }
    }
    return notMarkedAutomatedCases;
}