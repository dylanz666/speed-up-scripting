import assert = require('assert');
import axios from 'axios';
import { CaseHelper } from './caseHelper';
import { Configuration } from './configuration';

export class API {
    static async getCaseInfo(caseId: string) {
        const res = await axios.get(`${Configuration.configuration.testItEndpoint}/api/v1/case/${caseId}`, { timeout: 15e3 });
        assert(res.status == 200, `Fail to get case info with caseId: ${caseId}`);
        return res.data;
    }

    static async getReformattedCaseInfo(caseId: string) {
        const data = await this.getCaseInfo(caseId);
        return CaseHelper.reformatCaseInfo(data);
    }

    static async getCaseKeyInfo(caseId: string) {
        const data = await this.getCaseInfo(caseId);
        return CaseHelper.generateCaseKeyInfo(data);
    }

    static async loginTestit() {
        const data = {
            username: Configuration.configuration.username,
            password: Configuration.configuration.password
        }
        let res;
        try {
            res = await axios.post(`${Configuration.configuration.testItEndpoint}/api/v1/login`, data, { timeout: 15e3 });
            return res.data.access_token;
        } catch (e) {
            Configuration.configuration.username = "";
            Configuration.configuration.password = "";
            Configuration.persistConfiguration();
            assert(false, `Fail to login testit with username: ${data.username}, and password: ******`);
        }
    }

    static async searchCases(params: {
        accessToken: string,
        projectId: number[],
        prioritys: number[],
        prioritysOperator?: string,
        executionType: number[],
        executionTypeOperator?: string
    }) {
        const prioritysOperator = params.prioritysOperator || "in";
        const executionTypeOperator = params.executionTypeOperator || "in";
        const data = {
            projectIds: params.projectId,
            query: {
                queries: [
                    {
                        queries: [
                            {
                                property: "project_id",
                                operator: "in",
                                value: params.projectId,
                            },
                            {
                                property: "priority",
                                operator: prioritysOperator,
                                value: params.prioritys
                            },
                            {
                                property: "execution_type",
                                operator: executionTypeOperator,
                                value: params.executionType
                            }
                        ],
                        operator: "and"
                    },
                    {
                        property: "is_active",
                        operator: "=",
                        value: true
                    }
                ],
                operator: "and"
            }
        }
        const res = await axios.post(`${Configuration.configuration.testItEndpoint}/api/v1/search/cases`, data, {
            headers: {
                "Authorization": params.accessToken
            },
            timeout: 60e3
        });
        assert(res.status == 200, "Fail to search cases!");
        assert(res.data.length > 0, "No case found with search conditions!");

        const casePrefix = res.data[0].prefix;
        return await this.getCaseIdsFromSearchResult(res.data, casePrefix, []);
    }

    private static async getCaseIdsFromSearchResult(searchResult: any, casePrefix: string, caseIds: string[]) {
        for (let resultItem of searchResult) {
            if (resultItem.hasOwnProperty("externalId")) {
                caseIds.push(`${casePrefix}-${resultItem.externalId}`);
            }
            if (resultItem.hasOwnProperty("children")) {
                await this.getCaseIdsFromSearchResult(resultItem.children, casePrefix, caseIds);
            }
        }
        return caseIds;
    }
}
