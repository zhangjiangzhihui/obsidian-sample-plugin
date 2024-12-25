import { App, Modal, TextAreaComponent } from 'obsidian';
import CalloutProPlugin from '../../main';

export class CalloutEditorModal extends Modal {
    private plugin: CalloutProPlugin;
    private editor: TextAreaComponent;
    private calloutId: string;
    private content: string;
    private hasChanges: boolean = false;

    constructor(app: App, plugin: CalloutProPlugin, calloutId: string, initialContent: string = '') {
        super(app);
        this.plugin = plugin;
        this.calloutId = calloutId;
        this.content = initialContent;

        this.modalEl.style.width = '800px';
        this.modalEl.style.height = 'auto';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('callout-pro-modal');

        const headerDiv = contentEl.createDiv('callout-pro-modal-header');
        headerDiv.createEl('h2', { text: 'Edit Note' });

        const editorContainer = contentEl.createDiv('callout-pro-editor-container');
        
        this.editor = new TextAreaComponent(editorContainer);
        this.editor
            .setValue(this.content)
            .setPlaceholder('Write your note here...')
            .then(() => {
                this.editor.inputEl.focus();
            });

        this.editor.inputEl.addEventListener('input', () => {
            const currentContent = this.editor.getValue();
            this.hasChanges = currentContent !== this.content;
        });

        this.editor.inputEl.addClass('callout-pro-editor');
        
        const buttonContainer = contentEl.createDiv('callout-pro-button-container-left');
        
        const cancelButton = buttonContainer.createEl('button', {
            text: 'Cancel'
        });
        
        const saveButton = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'mod-cta'
        });

        cancelButton.addEventListener('click', () => {
            this.close();
        });

        saveButton.addEventListener('click', async () => {
            if (this.hasChanges) {
                await this.saveNote();
            }
            this.close();
        });

        this.scope.register([], 'Escape', () => {
            this.close();
        });
    }

    async saveNote() {
        const content = this.editor.getValue();
        const baseFolder = this.plugin.settings.notesFolder;
        
        try {
            // 确保基础文件夹存在
            if (!await this.app.vault.adapter.exists(baseFolder)) {
                await this.app.vault.createFolder(baseFolder);
            }

            // 为每个 callout 创建子文件夹
            const calloutFolder = `${baseFolder}/${this.calloutId}`;
            if (!await this.app.vault.adapter.exists(calloutFolder)) {
                await this.app.vault.createFolder(calloutFolder);
            }

            // 在子文件夹中创建笔记
            const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
            const fileName = `note-${timestamp}.md`;
            const filePath = `${calloutFolder}/${fileName}`;

            await this.app.vault.create(filePath, content);
            this.plugin.counter.incrementCount(this.calloutId);
            this.plugin.app.notices.show('Note saved successfully!');
        } catch (error) {
            console.error('Failed to save note:', error);
            this.plugin.app.notices.show('Failed to save note!', 3000);
            throw error;
        }
    }

    onClose() {
        if (this.editor) {
            this.editor = null;
        }
        const { contentEl } = this;
        contentEl.empty();
    }
} 