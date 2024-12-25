import { Plugin } from 'obsidian';
import { CalloutCounter } from './modules/counter';
import { CalloutProSettings, DEFAULT_SETTINGS, CalloutProSettingTab } from './settings';

export default class CalloutProPlugin extends Plugin {
    settings: CalloutProSettings;
    counter: CalloutCounter;

    async onload() {
        await this.loadSettings();
        
        console.log('Loading Callout Pro plugin');
        
        this.counter = new CalloutCounter(this);
        
        this.addSettingTab(new CalloutProSettingTab(this.app, this));
        
        // 注册视图更新事件
        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                this.counter.updateCounters();
            })
        );

        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                this.counter.updateCounters();
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.counter.updateCounters();
            })
        );

        // 初始化时更新计数器
        this.counter.updateCounters();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async onunload() {
        console.log('Unloading Callout Pro plugin');
        this.counter.removeCounters();
    }
} 