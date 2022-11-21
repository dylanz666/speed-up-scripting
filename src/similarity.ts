import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { API } from './api';
import axios from 'axios';
import { CaseHelper } from './caseHelper';
import * as stringSimilarity from "string-similarity";
import assert = require('assert');
const innerText = require('innertext');

export class Similarity {
    static async computionMaxSimilarity(params: {
        casePrefix: string,
        caseIdsAlongWithFilePath: { caseIds: string[], filePath: string }[],
        newCaseData: any,
        progress: vscode.Progress<{ message?: string; increment?: number }>
    }) {
        let pms = [];
        let caseGroupIndex = 0;
        let comparedCaseIds: string[] = [];
        let comparedCaseIdsFilePaths: string[] = [];
        let maxSimilarityInfo: { caseId: string, similarity: Number, filePath: string } = {
            caseId: "",
            similarity: 0,
            filePath: ""
        };
        let batchFileQuantity = 0;
        let comparedFileQuantity = 0;
        let index = 0;
        for (let caseInfo of params.caseIdsAlongWithFilePath) {
            index += 1;
            batchFileQuantity += 1;
            comparedFileQuantity += 1;
            for (let caseId of caseInfo.caseIds) {
                if (!caseId.startsWith(params.casePrefix) || comparedCaseIds.includes(caseId)) {
                    continue;
                }
                comparedCaseIds.push(caseId);
                comparedCaseIdsFilePaths.push(caseInfo.filePath);

                // prepare batch request: do 20 request a time
                caseGroupIndex += 1;
                if (caseGroupIndex <= Configuration.configuration.batchRequestSize) {
                    pms.push(API.getCaseInfo(caseId));
                }
                if (caseGroupIndex == Configuration.configuration.batchRequestSize || index == params.caseIdsAlongWithFilePath.length - 1) {
                    // do batch request
                    let batchData = await axios.all(pms);

                    caseGroupIndex = 0;
                    // do similarity compution
                    for (let data of batchData) {
                        const existedCaseData = CaseHelper.reformatCaseInfo(data);
                        const similarity: Number = this.compareKeyCaseData(params.newCaseData, existedCaseData);
                        if (similarity > maxSimilarityInfo.similarity) {
                            maxSimilarityInfo.caseId = `${data.prefix}-${data.externalId}`;
                            maxSimilarityInfo.similarity = similarity;
                            maxSimilarityInfo.filePath = comparedCaseIdsFilePaths[comparedCaseIds.indexOf(maxSimilarityInfo.caseId)];
                        }
                    }

                    params.progress.report({ message: `${comparedFileQuantity} of ${params.caseIdsAlongWithFilePath.length} file computed~`, increment: (batchFileQuantity / params.caseIdsAlongWithFilePath.length) * 100 });
                    batchFileQuantity = 0;
                    pms = [];
                }
            }
        }
        return maxSimilarityInfo;
    }

    static compareKeyCaseData(caseDataA: any, caseDataB: any) {
        if (!caseDataA || !caseDataB) {
            return 0;
        }
        let stepsAArr = [];
        for (let stepA of caseDataA.children) {
            stepsAArr.push({
                n: innerText(stepA.name),
                r: innerText(stepA.expectedResult)
            });
        }
        let stepsBArr = [];
        for (let stepB of caseDataB.children) {
            stepsBArr.push({
                n: innerText(stepB.name),
                r: innerText(stepB.expectedResult)
            });
        }

        const stepsA = JSON.stringify(stepsAArr)
        const stepsB = JSON.stringify(stepsBArr);
        const stepsSimilarity = stringSimilarity.compareTwoStrings(stepsA, stepsB);

        const preconditionsA = innerText(caseDataA.preconditions);
        const preconditionsB = innerText(caseDataB.preconditions);
        const preconditionsSimilarity = stringSimilarity.compareTwoStrings(preconditionsA, preconditionsB);

        return new Number(((stepsSimilarity + preconditionsSimilarity) / 2).toFixed(3));
    }

    static async computeTopSimilarityCases(params: {
        casePrefix: string,
        baseCaseData: any,
        targetCaseIds: string[],
        topQuantity: number,
        progress: vscode.Progress<{ message?: string; increment?: number }>
    }) {
        assert(params.topQuantity <= params.targetCaseIds.length, "Invalid topQuantity provided!");

        let pms = [];
        let caseGroupIndex = 0;
        let comparedCaseIds: string[] = [];
        let batchQuantity = 0;
        let comparedQuantity = 0;
        let topSimilarityCases: any[] = [];
        let index = 0;
        for (let caseId of params.targetCaseIds) {
            index += 1;
            batchQuantity += 1;
            comparedQuantity += 1;
            if (!caseId.startsWith(params.casePrefix) || comparedCaseIds.includes(caseId)) {
                continue;
            }
            comparedCaseIds.push(caseId);

            // prepare batch request: do 20 request a time
            caseGroupIndex += 1;
            if (caseGroupIndex <= Configuration.configuration.batchRequestSize) {
                pms.push(API.getCaseInfo(caseId));
            }
            if (caseGroupIndex == Configuration.configuration.batchRequestSize || index == params.targetCaseIds.length - 1) {
                // do batch request
                let batchData = await axios.all(pms);
                batchData = await this.batchFilterKeyCaseData(batchData);

                // do similarity compution
                for (let data of batchData) {
                    caseGroupIndex = 0;
                    const similarity: Number = this.compareKeyCaseData(params.baseCaseData, data);
                    topSimilarityCases.push({
                        caseId: `${data.prefix}-${data.externalId}`,
                        similarity: new Number(similarity.toFixed(3))
                    });
                }

                params.progress.report({ message: `${comparedQuantity} of ${params.targetCaseIds.length} case computed~`, increment: (batchQuantity / params.targetCaseIds.length) * 100 });
                batchQuantity = 0;
                pms = [];
            }
        }
        topSimilarityCases.sort(({ similarity: a }, { similarity: b }) => b - a);

        return topSimilarityCases.slice(0, params.topQuantity);
    }

    private static async batchFilterKeyCaseData(batchCaseData: any) {
        let batchKeyCaseData = [];
        for (let caseData of batchCaseData) {
            batchKeyCaseData.push(CaseHelper.reformatCaseInfo(caseData));
        }
        return batchKeyCaseData;
    }
}