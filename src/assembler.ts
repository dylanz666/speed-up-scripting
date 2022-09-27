import * as fs from "fs";
import * as path from "path";
import * as template from "art-template";
import { CaseHelper } from "./caseHelper";
import { Configuration } from "./configuration";

export class Assembler {
    static caseTemplateFilePath: string = "../template/caseTemplate.txt";
    static caseKeyInfoTemplateFilePath: string = "../template/caseKeyInfoTemplate.txt";
    static caseTemplateForReplacingFilePath: string = "../template/caseKeyInfoTemplateForReplacing.txt";

    static assembleContentForSimplelyRender(params: { caseData: any }) {
        const templateData = fs.readFileSync(path.resolve(__dirname, this.caseTemplateFilePath), "utf-8");
        const content = template.render(templateData, {
            caseName: params.caseData.name,
            caseId: params.caseData.caseId,
            priority: params.caseData.priority,
            keywords: params.caseData.keywords,
            automatedBy: params.caseData.automatedBy,
        });
        return content;
    }

    static assembleContentForReplacingCaseKeyInfo(params: { caseData: any }) {
        const templateData = fs.readFileSync(path.resolve(__dirname, this.caseTemplateForReplacingFilePath), "utf-8");
        let content = template.render(templateData, {
            caseName: params.caseData.name,
            caseId: params.caseData.caseId,
            priority: params.caseData.priority,
            keywords: params.caseData.keywords,
            automatedBy: params.caseData.automatedBy,
        });
        return content.trim();
    }

    static assembleCaseFromInheritedCase(params: {
        caseData: any,
        inherittedFilePath: string
    }) {
        // assemble new case key info
        const caseKeyInfo = CaseHelper.generateCaseKeyInfo(params.caseData);
        const templateData = fs.readFileSync(path.resolve(__dirname, this.caseKeyInfoTemplateFilePath), "utf-8");
        const renderredKeyInfoTemplate = template.render(templateData, {
            caseName: caseKeyInfo?.name,
            caseId: caseKeyInfo?.caseId,
            priority: caseKeyInfo?.priority,
            keywords: caseKeyInfo?.keywords,
            automatedBy: caseKeyInfo?.automatedBy,
        });

        // get first one of case in target file
        const caseString = fs.readFileSync(params.inherittedFilePath, "utf-8");
        const firstCaseLocation = caseString.indexOf("Case(") + 5;
        const firstPieceOfCaseString = caseString.substring(0, firstCaseLocation);
        let nextCaseLocation = caseString.indexOf("Case(", firstCaseLocation);
        nextCaseLocation = nextCaseLocation == -1 ? caseString.length : nextCaseLocation;
        const lastPieceOfCaseString = caseString.substring(caseString.indexOf("},") + 2, nextCaseLocation);

        return (firstPieceOfCaseString + "\n" + renderredKeyInfoTemplate + lastPieceOfCaseString).trim();
    }

    static assembleTopSimilarCasesContent(params: { topSimilarityCases: any[], caseId: string }) {
        let content: string = `// Top ${params.topSimilarityCases.length} cases similar to ${params.caseId} are:\n`;
        for (let i = 0; i < params.topSimilarityCases.length; i++) {
            const caseUrl = `${Configuration.configuration.testItEndpoint}/test-cases/${params.topSimilarityCases[i].caseId}`;
            content += `// ${i + 1}. ${caseUrl} : ${params.topSimilarityCases[i].similarity}${params.topSimilarityCases[i].similarity > 0.7 ? " -------> Recommend" : ""}\n`;
        }
        return content;
    }

    static assembleAutomatedCasesContent(params: { allCaseIdsAlongWithPriority: { id: string; priority: string; }[] }) {
        const p0 = params.allCaseIdsAlongWithPriority.filter((item) => {
            return item.priority == "0";
        });
        const p1 = params.allCaseIdsAlongWithPriority.filter((item) => {
            return item.priority == "1";
        });
        const p2 = params.allCaseIdsAlongWithPriority.filter((item) => {
            return item.priority == "2";
        });
        let content: string = `// Automated case: ${params.allCaseIdsAlongWithPriority.length}\n`;
        content += `// P0: ${p0.length}, P1: ${p1.length}, P2: ${p2.length}\n\n`;
        for (let caseIdsAlongWithPriority of params.allCaseIdsAlongWithPriority) {
            content += `// ${Configuration.configuration.testItEndpoint}/test-cases/${caseIdsAlongWithPriority.id} : P${caseIdsAlongWithPriority.priority}\n`;
        }
        return content;
    }

    static assembleContentFromNotMarkedAutomatedCases(params: {
        notMarkedAutomatedCases: {
            caseId: string,
            executionTypeId: number
        }[]
    }) {
        const automationTypes = ["Manual", "Automated", "Automatable", "Not Automatable", "Ready for Automation", "Automation Expired"];
        let content: string = `// Below ${params.notMarkedAutomatedCases.length} cases are automated in local but is not marked as automated on testit\n\n`;
        for (let i = 0; i < params.notMarkedAutomatedCases.length; i++) {
            content += `// ${i + 1}. ${Configuration.configuration.testItEndpoint}/test-cases/${params.notMarkedAutomatedCases[i].caseId} : ${automationTypes[params.notMarkedAutomatedCases[i].executionTypeId]}\n`;
        }
        return content;
    }
}