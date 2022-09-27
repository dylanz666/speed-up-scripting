import * as path from "path";

export class CaseHelper {
    static customizedKeywordsId = "xxx";
    static automatedById = "yyyyyy";

    static getCaseIdFromFile(filePath: string) {
        const caseId = path.basename(filePath).split(".")[0];
        return (!caseId || !caseId.includes("-") || !caseId.match(/\d/g)) ? "" : caseId;
    }

    static getCustomizedKeywords(caseData: any) {
        const preconditions = caseData.preconditions.toLowerCase();
        const keywordsItems = caseData.values.filter((item: { fieldId: string; }) => {
            return item.fieldId == this.customizedKeywordsId;
        });
        keywordsItems.reverse();
        let keywords = "";
        for (let keywordsItem of keywordsItems) {
            keywords += `, "${keywordsItem.name}"`;
        }
        keywords += `, "Web"`;
        if (preconditions.includes("jupiter") || preconditions.includes("electron")) {
            keywords += `, "Electron"`;
        }
        return keywords;
    }

    static getAutomatedBy(caseData: any) {
        const automatedByItems = caseData.values.filter((item: { fieldId: string; }) => {
            return item.fieldId == this.automatedById;
        });
        const namePieces = automatedByItems.length > 0 ? automatedByItems[0].name.toLowerCase().split(" ") : "";
        return namePieces ? `${namePieces[0]}.${namePieces[namePieces.length - 1]}` : "";
    }

    static generateCaseKeyInfo(caseData: any) {
        return {
            caseId: `${caseData.prefix}-${caseData.externalId}`,
            name: caseData.name,
            priority: `P${caseData.priority}`,
            automatedBy: this.getAutomatedBy(caseData),
            keywords: this.getCustomizedKeywords(caseData)
        }
    }

    static reformatCaseInfo(caseData: any) {
        return {
            caseId: `${caseData.prefix}-${caseData.externalId}`,
            prefix: caseData.prefix,
            externalId: caseData.externalId,
            children: caseData.children,
            name: caseData.name,
            preconditions: caseData.preconditions,
            priority: caseData.priority,
            summary: caseData.summary,
            values: caseData.values,
            keywords: this.getCustomizedKeywords(caseData)
        };
    }
}