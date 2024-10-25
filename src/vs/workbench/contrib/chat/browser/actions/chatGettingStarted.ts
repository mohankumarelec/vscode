/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IWorkbenchContribution } from '../../../../common/contributions.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { IProductService } from '../../../../../platform/product/common/productService.js';
import { ICommandService } from '../../../../../platform/commands/common/commands.js';
import { IExtensionService } from '../../../../services/extensions/common/extensions.js';
import { ExtensionIdentifier } from '../../../../../platform/extensions/common/extensions.js';
import { CHAT_OPEN_ACTION_ID } from './chatActions.js';


export class ChatGettingStartedContribution extends Disposable implements IWorkbenchContribution {
	static readonly ID = 'workbench.contrib.chatGettingStarted';
	private recentlyInstalled: boolean = false;

	constructor(
		@IProductService private readonly productService: IProductService,
		@IExtensionService private readonly extensionService: IExtensionService,
		@ICommandService private readonly commandService: ICommandService,
	) {
		super();

		if (!this.productService.gitHubEntitlement) {
			return;
		}

		this.registerListeners();
	}

	private registerListeners() {

		this._register(this.extensionService.onDidChangeExtensions((result) => {
			for (const ext of result.added) {
				if (ExtensionIdentifier.equals(this.productService.gitHubEntitlement!.extensionId, ext.identifier)) {
					this.recentlyInstalled = true;
					return;
				}
			}
		}));

		this.extensionService.onDidChangeExtensionsStatus(async (event) => {
			for (const ext of event) {
				if (ExtensionIdentifier.equals(this.productService.gitHubEntitlement!.extensionId, ext.value)) {
					const extensionStatus = this.extensionService.getExtensionsStatus();
					if (extensionStatus[ext.value].activationTimes && this.recentlyInstalled) {
						await this.commandService.executeCommand(CHAT_OPEN_ACTION_ID);
						this.recentlyInstalled = false;
						return;
					}
				}
			}
		});
	}
}