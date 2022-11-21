import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { API } from './api';
import * as assert from "assert";
import { CaseHelper } from './caseHelper';
import { FileUtil } from './fileUtil';
import { Assembler } from './assembler';
import { Similarity } from './similarity';

export async function inheritFromMostSimilarCase() {
    return vscode.commands.registerCommand('scripting.inheritFromMostSimilarCase', async () => {
        const editor = vscode.window.activeTextEditor;
        assert(editor, "Please focus to the editor!");

        vscode.window.showInformationMessage("Inherit from most similar case?", { modal: true }, { title: 'Yes' }).then(async (answer) => {
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
                prepareCaseFileNameEnding: true,
                prepareBatchRequestSize: true,
                prepareInheritingFolder: true
            });

            // get caseId from current file name
            const caseId = CaseHelper.getCaseIdFromFile(editor.document.fileName);
            assert(!!caseId, "The caseId is not ok, please check current file name!");
            const casePrefix = caseId.split("-")[0];

            // get new case's testit data and reformat it
            let caseData = await API.getReformattedCaseInfo(caseId);
            assert(!!caseData, `The case ${caseId} is not existing!`);

            // get caseIdsAlongWithFilePath for all files in workspace
            const workspaceFolder = vscode.workspace.workspaceFolders?.map((folder) => folder.uri.fsPath)[0];
            assert(!!workspaceFolder, "Not a valid workspace folder!");
            const fileList = FileUtil.getFileListWithFileNamePattern(workspaceFolder, Configuration.configuration.caseFileNameEnding);
            const caseIdsAlongWithFilePath: {
                caseIds: string[],
                filePath: string
            }[] = await FileUtil.getCaseIdsAlongWithFilePathFromFileList({
                fileList: fileList,
                caseIdToAbort: caseId,
                casePrefix: casePrefix
            });

            // get all caseIds' detail from testit and do similarity compution
            let maxSimilarityInfo: { caseId: any; filePath: any; similarity?: Number; };
            vscode.window.withProgress({
                cancellable: false,
                location: vscode.ProgressLocation.Notification,
                title: "Compute case similarity",
            }, async (progress) => {
                progress.report({ increment: 0 });
                // do similarity compution and update progress
                maxSimilarityInfo = await Similarity.computionMaxSimilarity({
                    casePrefix: casePrefix,
                    caseIdsAlongWithFilePath: caseIdsAlongWithFilePath,
                    newCaseData: caseData,
                    progress: progress
                });

                if (!maxSimilarityInfo.caseId) {
                    vscode.window.showInformationMessage("Compute error, please do it again with valid workspace folder");
                    return;
                }

                // let customer decide whether to inherit from most similar case or not
                vscode.window.showInformationMessage(`Max similarity: ${maxSimilarityInfo.similarity}, Inherit from ${maxSimilarityInfo.caseId}?`,
                    { modal: true }, { title: 'Yes' }).then(async (answer) => {
                        const editor = vscode.window.activeTextEditor;
                        assert(editor, "Please focus to the editor!");
                        if (answer?.title != "Yes") {
                            const caseId = CaseHelper.getCaseIdFromFile(editor.document.fileName);
                            assert(!!caseId, "The caseId is not ok, please check current file name!");

                            const caseData = await API.getCaseKeyInfo(caseId);
                            const content = Assembler.assembleContentForSimplelyRender({ caseData: caseData });

                            const snippet: vscode.SnippetString = new vscode.SnippetString(content);
                            editor.insertSnippet(snippet);
                            return;
                        }
                        const caseString = Assembler.assembleCaseFromInheritedCase({
                            caseData: caseData,
                            inherittedFilePath: maxSimilarityInfo.filePath
                        });
                        // render new case to editor
                        const snippet: vscode.SnippetString = new vscode.SnippetString(caseString);
                        editor.insertSnippet(snippet);
                    });
            });
        }
    });
}