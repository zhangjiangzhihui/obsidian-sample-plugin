import { App, PluginSettingTab, Setting, TFolder } from 'obsidian';
import CalloutProPlugin from './main';

export interface CalloutProSettings {
    notesFolder: string;
}

export const DEFAULT_SETTINGS: CalloutProSettings = {
    notesFolder: 'callout-notes'
}

export class CalloutProSettingTab extends PluginSettingTab {
    plugin: CalloutProPlugin;

    constructor(app: App, plugin: CalloutProPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Notes Folder')
            .setDesc('Select the folder where callout notes will be stored')
            .addDropdown(dropdown => {
                // 添加默认选项
                dropdown.addOption('callout-notes', 'callout-notes (默认)');
                
                // 获取所有文件夹
                const folders = this.getAllFolders();
                folders.forEach(folder => {
                    if (folder.path !== 'callout-notes') { // 避免重复添加默认选项
                        dropdown.addOption(folder.path, folder.path);
                    }
                });
                
                // 设置当前值
                dropdown.setValue(this.plugin.settings.notesFolder);
                
                dropdown.onChange(async (value) => {
                    this.plugin.settings.notesFolder = value;
                    await this.plugin.saveSettings();
                });
            });
    }

    private getAllFolders(): TFolder[] {
        const folders: TFolder[] = [];
        
        // 递归获取所有文件夹
        const recurseFolder = (folder: TFolder) => {
            folders.push(folder);
            folder.children.forEach(child => {
                if (child instanceof TFolder) {
                    recurseFolder(child);
                }
            });
        };

        // 从根目录开始递归
        this.app.vault.getAllLoadedFiles().forEach(file => {
            if (file instanceof TFolder) {
                recurseFolder(file);
            }
        });

        return folders;
    }
} 