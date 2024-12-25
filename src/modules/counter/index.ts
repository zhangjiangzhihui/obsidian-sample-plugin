import { Plugin, TFile } from 'obsidian';
import { CalloutEditorModal } from '../editor/CalloutEditorModal';

interface CounterData {
    [calloutId: string]: number;
}

export class CalloutCounter {
    private plugin: Plugin;
    private counters: Map<string, HTMLElement> = new Map();
    private counts: Map<string, number> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
        this.loadCounts();
        this.registerEvents();
    }

    private registerEvents() {
        // 文件删除事件
        this.plugin.registerEvent(
            this.plugin.app.vault.on('delete', async (file) => {
                if (file instanceof TFile && file.path.startsWith(this.plugin.settings.notesFolder)) {
                    await this.refreshAllCounts();
                }
            })
        );

        // 布局变化事件
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('layout-change', () => {
                this.updateCounterDisplays();
            })
        );

        // 活动文件变化事件
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('active-leaf-change', () => {
                this.updateCounterDisplays();
            })
        );
    }

    private async refreshAllCounts() {
        await this.loadCounts();
        await this.updateCounterDisplays();
    }

    private getCalloutId(callout: Element): string {
        const title = callout.querySelector('.callout-title')?.textContent?.trim() || '';
        const calloutType = callout.getAttribute('data-callout') || '';
        const content = callout.querySelector('.callout-content');
        const timestamp = content?.textContent?.match(/\^(\d{16})/)?.[1];
        const index = Array.from(document.querySelectorAll('.callout')).indexOf(callout);

        const baseId = `callout-${calloutType}-${title.toLowerCase().replace(/\s+/g, '-')}-${index}`;
        return timestamp ? `${baseId}-${timestamp}` : baseId;
    }

    async updateCounterDisplays() {
        this.removeCounters();
        const callouts = document.querySelectorAll('.callout');
        
        for (const callout of callouts) {
            const calloutId = this.getCalloutId(callout);
            const count = await this.getCalloutCount(calloutId);
            const counter = this.createCounterElement(calloutId, count);
            
            if (window.getComputedStyle(callout).position === 'static') {
                (callout as HTMLElement).style.position = 'relative';
            }
            
            callout.appendChild(counter);
            this.counters.set(calloutId, counter);
        }
    }

    private async getCalloutCount(calloutId: string): Promise<number> {
        const files = await this.plugin.app.vault.getMarkdownFiles();
        const baseFolder = this.plugin.settings.notesFolder;
        
        const count = files.filter(file => {
            if (!file.path.startsWith(baseFolder)) return false;
            return file.path.includes(calloutId);
        }).length;

        this.counts.set(calloutId, count);
        await this.saveCounts();
        return count;
    }

    private async loadCounts() {
        try {
            const data = await this.plugin.loadData();
            const countsData = data?.counts || {};
            this.counts = new Map(Object.entries(countsData));
            console.log('Loaded counts:', this.counts);
        } catch (error) {
            console.error('Failed to load counts:', error);
        }
    }

    private async saveCounts() {
        try {
            const countsData = Object.fromEntries(this.counts);
            await this.plugin.saveData({
                counts: countsData
            });
            console.log('Saved counts:', countsData);
        } catch (error) {
            console.error('Failed to save counts:', error);
        }
    }

    private createCounterElement(calloutId: string, count: number): HTMLElement {
        const counter = document.createElement('div');
        counter.className = 'callout-pro-counter';
        
        // 添加图标
        const icon = document.createElement('span');
        icon.innerHTML = '💬';
        icon.style.marginRight = '4px';
        counter.appendChild(icon);

        // 添加数字显示
        const numberSpan = counter.createSpan({ cls: 'counter-number' });
        numberSpan.textContent = count.toString();

        // 添加点击事件
        counter.addEventListener('click', async (e) => {
            e.stopPropagation();
            const callout = counter.closest('.callout');
            if (callout) {
                const modal = new CalloutEditorModal(this.plugin.app, this.plugin as any, calloutId);
                modal.open();
            }
        });

        return counter;
    }

    removeCounters() {
        this.counters.forEach(counter => counter.remove());
        this.counters.clear();
    }
} 