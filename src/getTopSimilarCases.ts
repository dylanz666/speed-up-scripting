import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { API } from './api';
import * as assert from "assert";
import { CaseHelper } from './caseHelper';
import { Similarity } from './similarity';
import { Assembler } from './assembler';

export async function getTopSimilarCases() {
    return vscode.commands.registerCommand('scripting.getTopSimilarCases', async () => {
        const editor = vscode.window.activeTextEditor;
        assert(editor, "Please focus to the editor!");

        const caseId = CaseHelper.getCaseIdFromFile(editor.document.fileName);
        assert(!!caseId, "The caseId is not ok, please check current file name!");
        const casePrefix = caseId.split("-")[0];

        vscode.window.showInformationMessage("Get top similar cases. Initialize case searching conditions?", { modal: true }, { title: 'Yes' })
            .then(async (answer) => {
                if (answer?.title == "Yes") {
                    await Configuration.initSearchCaseConditions();
                } else {
                    vscode.window.showInformationMessage("Case searching conditions are not initialized~");
                }
            }).then(async () => {
                try {
                    await Configuration.prepareConfiguration({
                        prepareTestItEndpoint: true,
                        prepareTestItUsernamePassword: true,
                        prepareSearchCaseConditions: true,
                        prepareBatchRequestSize: true
                    });
                } catch (e) {
                    vscode.window.showInformationMessage("Canceled~");
                    return;
                }

                const accessToken = await API.loginTestit();
                vscode.window.showInformationMessage("Start searching cases...");
                let caseIds = await API.searchCases({
                    accessToken: accessToken,
                    projectId: Configuration.configuration.projectId,
                    prioritys: Configuration.configuration.prioritys,
                    prioritysOperator: Configuration.configuration.prioritysOperator,
                    executionType: Configuration.configuration.executionType,
                    executionTypeOperator: Configuration.configuration.executionTypeOperator
                });
                caseIds.indexOf(caseId) > -1 ? caseIds.splice(caseIds.indexOf(caseId), 1) : null;

                // get new case's testit data and reformat it
                let caseData = await API.getReformattedCaseInfo(caseId);
                assert(!!caseData, `The case ${caseId} is not existing!`);

                // get all caseIds' detail from testit and do similarity compution
                const topQuantity = 5;
                vscode.window.withProgress({
                    cancellable: false,
                    location: vscode.ProgressLocation.Notification,
                    title: `Filter top ${topQuantity} similar cases`,
                }, async (progress) => {
                    progress.report({ increment: 0 });
                    // do similarity compution and update progress
                    const topSimilarityCases = await Similarity.computeTopSimilarityCases({
                        casePrefix: casePrefix,
                        baseCaseData: caseData,
                        targetCaseIds: caseIds,
                        topQuantity: topQuantity,
                        progress: progress
                    });

                    const editor = vscode.window.activeTextEditor;
                    assert(editor, "Please focus to the editor!");

                    const content = Assembler.assembleTopSimilarCasesContent({ topSimilarityCases: topSimilarityCases, caseId: caseId });
                    const snippet: vscode.SnippetString = new vscode.SnippetString(content);
                    editor.insertSnippet(snippet);
                    return;
                });
            });
    });
}