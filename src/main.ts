import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Modal,
	Notice,
	Plugin,
	requestUrl,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	CalibreServerSettings,
	CalibreSettingTab,
} from './settings';

// Remember to rename these classes and interfaces!

/* TODO:
- check if folder exist ✅
- create folder ✅

- base calibre content server url
- fetch data from url and hash it 

- hashcheck
- if hash differs, update data ✅
- save hash for future check ✅

- file exist? update. if not, create new markdown
- cover differs? download cover
- new file? create with template
 */

interface CalibreBook {
	application_id: number
	title: string
	authors: string[]
	tags: string[]
	cover: string
	formats: string[]
	main_format: string[]
	publisher: string
	languages: string[]
	uuid: string
	timestamp: string
	last_modified: string
	series_index: number
	series: string
	path: string
}

type BooksResponse = Record<string, CalibreBook>;

export default class CalibreServerSync extends Plugin {
	settings!: CalibreServerSettings;
	mimeToExtension(contentType: string): string {
		switch (contentType) {
			case "image/jpeg":
				return "jpg";
			case "image/png":
				return "png";
			case "image/webp":
				return "webp";
			case "image/gif":
				return "gif";
			default:
				return "bin";
		}
	}

	async onload() {
		// this.addCommand({
		// 	id: 'create-file',
		// 	name: 'Create file',
		// 	callback: async () => {
		// 		const content = "Hello random";
		// 		await this.app.vault.create("books/random.md", content);
		// 	},
		// });
		this.addCommand({
			id: "check-calibre-server",
			name: "Check calibre server",
			callback: async() => {
				new Notice('Checking calibre');
				try {
					const url = this.settings.baseUrl
					const readerUrl = this.settings.readerUrl
					new Notice(`Calibre URL: ${url}`)
					const response = await requestUrl(
						`${url}/ajax/books`
					);	
					new Notice(String(response.status));
					if (response.status == 200) {
						
						// await this.app.vault.create(
						// 	"./Books/testresponse.md",
						// 	JSON.stringify(response.json)
						// );
						let books = response.json as BooksResponse
						for(const id in books){
							const book = books[id]
							if (Number(id) > 100 || Number(id) < 90) {
								continue;
							}
							if (!book) continue;
							// console.log(book.title);
							const authors = book.authors.map(author => {
								return `\n- "${author}"`
							}).join("");
							const tags = book.tags.map(tag => {
								return `\n- "${tag}"`
							}).join("");
							const languages = book.tags.map(language => {
								return `\n- "${language}"`
							}).join("");
							const cover = await requestUrl(
								`${url}/${book.cover}`
							);
							const format = book.formats[0];

							const regex = /[*"\\/<>:|?]/g;
							const cleanedTitle = book.title.replaceAll(regex, "");
							const mime = cover.headers["content-type"] ?? "";
							const extension = this.mimeToExtension(mime);
							const coverPath = `Books/Cover/${cleanedTitle}.${extension}`
							const exists = this.app.vault.getAbstractFileByPath(coverPath);

							if (!exists) {
								// await this.app.vault.modifyBinary(
								// 	exists as TFile,
								// 	cover.arrayBuffer
								// );
								await this.app.vault.createBinary(
									coverPath,
									cover.arrayBuffer
								);
							}

							const content = `---
title: "${book.title}"
authors: ${authors}
tags: ${tags}
cover: "${book.cover}"
publisher: ${book.publisher}
languages: ${languages}
application_id:	${book.application_id}
uuid: ${book.uuid}
timestamp: ${book.timestamp}
last_modified:	${book.last_modified}
series_index: ${book.series_index}
series: ${book.series}
download_path: "${url}/get/${format}/${book.application_id}/books"
read_path: "${readerUrl}/read/${book.application_id}/${format}"

cover_path: "${coverPath}"
---
![[${coverPath}|${this.settings.coverWidth}]]

# ${book.title}
## Summary
## Notes
`;
							
							
							// console.log(cleanedTitle);
							// const cleanedAuthor = book.authors[0].replaceAll(regex, "");
							const path = `Books/${cleanedTitle}.md`
							const existing = this.app.vault.getAbstractFileByPath(path);
							if (!existing) {
								await this.app.vault.create(path,content);
							}
							
						}
					}
				} catch (error) {
					new Notice(String(error));
				}
			}
		})

		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon('dice', 'Sample', (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (
				editor: Editor,
				_ctx: MarkdownView | MarkdownFileInfo,
			) => {
				editor.replaceSelection('Sample editor command');
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new CalibreSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(activeDocument, 'click', (_evt: MouseEvent) => {
			new Notice('Click');
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		// this.registerInterval(
		// 	window.setInterval(() => console.log('setInterval'), 1 * 1 * 1000),
		// );
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<CalibreServerSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
