import * as fs from "fs";
import * as path from "path";
import * as readLine from "readline";
import * as events from "events";
import * as assert from "assert";

export class FileUtil {
    static getFileListWithFileNamePattern(folder: string, fileNameEndWith: string, fileList: string[] = [], fileNameList: string[] = []) {
        const files = fs.readdirSync(folder);
        files.forEach((fileName) => {
            const relativePath = path.join(folder, fileName);
            const stat = fs.statSync(relativePath);
            if (stat.isDirectory()) {
                FileUtil.getFileListWithFileNamePattern(relativePath, fileNameEndWith, fileList, fileNameList);
            } else {
                if ((!fileNameEndWith || (fileNameEndWith && fileName.endsWith(fileNameEndWith))) && !fileNameList.includes(fileName)) {
                    fileList.push(relativePath);
                    fileNameList.push(fileName);
                }
            }
        });
        return fileList;
    }

    static async getCaseIdsFromFile(params: { filePath: string, casePrefix: string }) {
        let caseIds: string[] = [];
        let ids: any;
        let skipped: boolean = false;
        const rl = readLine.createInterface({ input: fs.createReadStream(params.filePath) });
        rl.on('line', line => {
            if (line.trim().startsWith("ids:")) {
                const lineString = line.substring(line.indexOf("["), line.indexOf("]") + 1);
                ids = JSON.parse(lineString);
                if (params.casePrefix) {
                    ids = ids.filter((item: string) => {
                        return item.startsWith(params.casePrefix);
                    });
                }
            }
            if (line.trim().startsWith("skipBy:")) {
                skipped = true;
            }
        });
        await events.once(rl, 'close');

        if (!ids || skipped) {
            return [];
        }
        return caseIds.concat(ids);
    }

    static async getCaseIdsFromFileList(params: { fileList: string[], casePrefix: string }) {
        let caseIds: string[] = [];
        for (let filePath of params.fileList) {
            const idsInFile = await FileUtil.getCaseIdsFromFile({ filePath: filePath, casePrefix: params.casePrefix });
            if (idsInFile.length == 0) {
                continue;
            }
            caseIds = caseIds.concat(idsInFile);
        }
        return caseIds;
    }

    static async getCaseIdsAlongWithFilePathFromFileList(params: { fileList: string[], caseIdToAbort?: string, casePrefix: string }) {
        let fileInfo: { caseIds: string[], filePath: string }[] = [];
        for (let filePath of params.fileList) {
            const idsInFile = await FileUtil.getCaseIdsFromFile({ filePath: filePath, casePrefix: params.casePrefix });
            if (idsInFile.length == 0) {
                continue;
            }
            // when the case is existing, then exit
            if (params.caseIdToAbort) {
                assert(!idsInFile.includes(params.caseIdToAbort), `The case ${params.caseIdToAbort} is already existing in ${filePath}`);
            }
            fileInfo.push({
                caseIds: idsInFile,
                filePath: filePath
            });
        }
        return fileInfo;
    }

    static async getCaseIdsAlongWithPriorityFromFile(params: { filePath: string, casePrefix: string }) {
        let caseKeyInfo: { id: string; priority: string; }[] = [];
        let ids: any;
        let priority: string = "";
        let skipped: boolean = false;
        const rl = readLine.createInterface({ input: fs.createReadStream(params.filePath) });
        rl.on('line', async (line) => {
            if (line.trim().startsWith("ids:")) {
                const lineString = line.substring(line.indexOf("["), line.indexOf("]") + 1);
                ids = JSON.parse(lineString);
                ids = ids.filter((item: string) => {
                    return item.startsWith(params.casePrefix);
                });
            }
            if (line.trim().startsWith("priority:")) {
                const matched = line.match(/\d/g);
                priority = matched ? matched[0] : "";
            }
            if (line.trim().startsWith("skipBy:")) {
                skipped = true;
            }
            if (ids && priority && line.includes("async ")) {
                return;
            }
        });
        await events.once(rl, 'close');

        if (!ids || skipped) {
            return [];
        }
        for (let id of ids) {
            caseKeyInfo.push({
                id: id,
                priority: priority
            });
        }
        return caseKeyInfo;
    }

    static async getCaseIdsAlongWithPriorityFromFileList(params: { fileList: string[], casePrefix: string }) {
        let caseIdsAlongWithPriority: { id: string; priority: string; }[] = [];
        for (let filePath of params.fileList) {
            const caseIdsWithPriority = await FileUtil.getCaseIdsAlongWithPriorityFromFile({ filePath: filePath, casePrefix: params.casePrefix });
            if (!caseIdsWithPriority) {
                continue;
            }
            caseIdsAlongWithPriority = caseIdsAlongWithPriority.concat(caseIdsWithPriority);
        }
        return caseIdsAlongWithPriority;
    }

    static writeFile(filePath: string, data: string) {
        fs.writeFileSync(filePath, data);
    }
}