import { App, PluginSettingTab, Setting } from 'obsidian';
import MyPlugin from './main';

export interface CalibreServerSettings {
	mySetting: string;
	baseUrl: string;
	readerUrl: string;
	coverWidth: number;
}

export const DEFAULT_SETTINGS: CalibreServerSettings = {
	mySetting: 'default',
	baseUrl: 'http://192.168.0.1:8080',
	readerUrl: 'http://192.168.0.1:8083',
	coverWidth: 320,
};

export class CalibreSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName('Base URL')
			.setDesc("Calibre-server URL to fetch library")
			.addText((text) =>
				text
					.setPlaceholder('Enter your URL')
					.setValue(this.plugin.settings.baseUrl)
					.onChange(async (value) => {
						this.plugin.settings.baseUrl = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName('Reader URL')
			.setDesc("Ebook reader URL")
			.addText((text) =>
				text
					.setPlaceholder('Enter your reader URL')
					.setValue(this.plugin.settings.readerUrl)
					.onChange(async (value) => {
						this.plugin.settings.readerUrl = value;
						await this.plugin.saveSettings();
					}),
			);
		new Setting(containerEl)
			.setName('Cover width')
			.setDesc("Cover width in pixels")
			.addText((text) =>
				text
					.setPlaceholder('Enter your width (px)')
					.setValue(String(this.plugin.settings.coverWidth))
					.onChange(async (value) => {
						this.plugin.settings.coverWidth = Number(value);
						await this.plugin.saveSettings();
					}),
			);
	}
}
