import * as assert from "assert";
import * as path from "path";
import * as vscode from 'vscode';
import { FileUtil } from "./fileUtil";

export class Configuration {
    public static defaultTestItEndpoint = "https://xxx.yyyy.com";
    public static defaultCasePrefix = "RCW";
    public static defaultBaseFileNameEnding = ".test.ts";
    public static defaultBatchRequestSize = 20;
    public static configurationFilePath = path.resolve(__dirname, "../configuration.json");
    public static configuration = require(this.configurationFilePath);

    static persistConfiguration() {
        FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
    }

    static initConfiguration() {
        return vscode.commands.registerCommand('scripting.initConfiguration', async () => {
            vscode.window.showInformationMessage("Initialize all configuration?", { modal: true }, { title: 'OK' })
                .then((answer) => {
                    if (answer?.title == "OK") {
                        FileUtil.writeFile(this.configurationFilePath, JSON.stringify({}, null, "\t"));
                        this.configuration = {};
                        vscode.window.showInformationMessage('Configuration Deleted!');
                        return;
                    }
                    vscode.window.showInformationMessage("Canceled~");
                });
        });
    }

    static async prepareConfiguration(params: {
        prepareTestItEndpoint?: boolean,
        prepareCaseFileNameEnding?: boolean,
        prepareBatchRequestSize?: boolean,
        prepareInheritingFolder?: boolean,
        prepareTestItUsernamePassword?: boolean,
        prepareSearchCaseConditions?: boolean,
        prepareCasePrefix?: boolean
    }) {
        vscode.window.showInformationMessage(this.configuration);

        if (params.prepareTestItEndpoint && !this.configuration.testItEndpoint) {
            const testItEndpoint = await vscode.window.showInputBox({ title: `Please input TestIt Endpoint, default: ${this.defaultTestItEndpoint}` });
            assert(testItEndpoint != undefined, "Canceled~");
            this.configuration.testItEndpoint = testItEndpoint || this.defaultTestItEndpoint;

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage(`TestIt endpoint is saved: ${this.configuration.testItEndpoint}`);
        }
        if (params.prepareTestItUsernamePassword && (!this.configuration.username || !this.configuration.password)) {
            const username = await vscode.window.showInputBox({ title: "Please input testIt username" });
            assert(username != undefined, "Please input valid username!");
            const password = await vscode.window.showInputBox({ title: "Please input testIt password", password: true });
            assert(password != undefined, "Please input valid password!");

            this.configuration.username = username;
            this.configuration.password = password;

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage(`TestIt username and password are saved, username: ${username}, password: ******`);
        }
        if (params.prepareInheritingFolder && !this.configuration.inheritingFolder) {
            const inheritingFolder = await vscode.window.showInputBox({ title: "Please input case folder, default is your root folder" });
            assert(inheritingFolder != undefined, "Canceled~");
            this.configuration.inheritingFolder = inheritingFolder || "";

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage(`TestIt case folder is saved: ${this.configuration.inheritingFolder}`);
        }
        if (params.prepareCaseFileNameEnding && !this.configuration.caseFileNameEnding) {
            const caseFileNameEnding = await vscode.window.showInputBox({ title: `Please input case file name ending, default: ${this.defaultBaseFileNameEnding}` });
            assert(caseFileNameEnding != undefined, "Canceled~");
            this.configuration.caseFileNameEnding = caseFileNameEnding || this.defaultBaseFileNameEnding;

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage(`Case file name ending is saved: ${this.configuration.caseFileNameEnding}`);
        }
        if (params.prepareSearchCaseConditions && (!this.configuration.projectId || this.configuration.projectId.length == 0)) {
            const projectId = await vscode.window.showInputBox({ title: "Please input testit projectId" });
            assert(projectId != undefined, "Canceled~");
            this.configuration.projectId = projectId ? [parseInt(projectId)] : [];

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage("TestIt search case conditions are saved");
        }
        if (params.prepareSearchCaseConditions && (!this.configuration.prioritys || this.configuration.prioritys.length == 0)) {
            const prioritysStr = await vscode.window.showInputBox({ title: "Please input search cases' prioritys, like 0 or 0,1 and default is 0,1" });
            assert(prioritysStr != undefined, "Canceled~");
            const prioritys = prioritysStr ? prioritysStr.split(",") : [0, 1];

            this.configuration.prioritys = prioritys;
            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage("TestIt search case conditions are saved");
        }
        if (params.prepareSearchCaseConditions && !this.configuration.prioritysOperator) {
            const prioritysOperator = await vscode.window.showInputBox({ title: "Please input prioritysOperator, default is 'in'" });
            assert(prioritysOperator != undefined, "Canceled~");
            this.configuration.prioritysOperator = prioritysOperator || "in";

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage("TestIt search case conditions are saved");
        }
        if (params.prepareSearchCaseConditions && (!this.configuration.executionType || this.configuration.executionType.length == 0)) {
            const executionTypeStr = await vscode.window.showInputBox({ title: "Please input search cases' executionType, like 1 or 1,2 and default is 2" });
            assert(executionTypeStr != undefined, "Canceled~");
            const executionType = executionTypeStr ? executionTypeStr.split(",") : [2];
            this.configuration.executionType = executionType;

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage("TestIt search case conditions are saved");
        }
        if (params.prepareSearchCaseConditions && !this.configuration.executionTypeOperator) {
            const executionTypeOperator = await vscode.window.showInputBox({ title: "Please input executionTypeOperator, default is 'in'" });
            assert(executionTypeOperator != undefined, "Canceled~");
            this.configuration.executionTypeOperator = executionTypeOperator || "in";

            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage("TestIt search case conditions are saved");
        }
        if (params.prepareBatchRequestSize && !this.configuration.batchRequestSize) {
            const batchRequestSize = await vscode.window.showInputBox({ title: `Please input batch request size, default: ${this.defaultBatchRequestSize}` });
            assert(batchRequestSize != undefined, "Canceled~");
            this.configuration.batchRequestSize = batchRequestSize || this.defaultBatchRequestSize;
            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage(`TestIt batch request size is saved: ${this.configuration.batchRequestSize}`);
        }

        if (params.prepareCasePrefix && !this.configuration.prepareCasePrefix) {
            const casePrefix = await vscode.window.showInputBox({ title: `Please input case prefix, default: ${this.defaultCasePrefix}` });
            assert(casePrefix != undefined, "Canceled~");
            this.configuration.casePrefix = casePrefix || this.defaultCasePrefix;
            FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
            vscode.window.showInformationMessage(`Case prefix is saved: ${this.configuration.casePrefix}`);
        }
    }

    static async initSearchCaseConditions(params?: {
        initializeProjectId?: boolean
    }) {
        this.configuration.projectId = params?.initializeProjectId ? [] : this.configuration.projectId;
        this.configuration.prioritys = [];
        this.configuration.prioritysOperator = "";
        this.configuration.executionType = [];
        this.configuration.executionTypeOperator = "";
        FileUtil.writeFile(this.configurationFilePath, JSON.stringify(this.configuration, null, "\t"));
        vscode.window.showInformationMessage("TestIt search case conditions are initialized");
    }
}