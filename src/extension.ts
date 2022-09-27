import * as vscode from 'vscode';
import { Configuration } from './configuration';
import { simplyRenderCase } from './simplyRenderCase';
import { inheritFromMostSimilarCase } from './inheritFromMostSimilarCase';
import { getTopSimilarCases } from './getTopSimilarCases';
import { getAllAutomatedCases } from './getAllAutomatedCases';
import { getNotMarkedAsAutomatedCases } from './getNotMarkedAsAutomatedCases';
import { replaceKeyInfoForCase } from './replaceKeyInfoForCase';

export async function activate(context: vscode.ExtensionContext) {
	const initConfiguration = Configuration.initConfiguration();
	const simplyRender = await simplyRenderCase()
	const inheritFromMostSimilar = await inheritFromMostSimilarCase();
	const getTopSimilarCase = await getTopSimilarCases();
	const getAllAutomatedCase = await getAllAutomatedCases();
	const getNotMarkedAsAutomatedCase = await getNotMarkedAsAutomatedCases();
	const replaceKeyInfo = await replaceKeyInfoForCase();

	context.subscriptions.push(initConfiguration);
	context.subscriptions.push(simplyRender);
	context.subscriptions.push(inheritFromMostSimilar);
	context.subscriptions.push(getTopSimilarCase);
	context.subscriptions.push(getAllAutomatedCase);
	context.subscriptions.push(getNotMarkedAsAutomatedCase);
	context.subscriptions.push(replaceKeyInfo);
}

export function deactivate() { }
