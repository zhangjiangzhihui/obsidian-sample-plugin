import { Plugin } from 'obsidian';
import { createCounterElement } from './styles';

export class CalloutCounter {
    private plugin: Plugin;
    private counters: Map<string, HTMLElement> = new Map();

    constructor(plugin: Plugin) {
        this.plugin = plugin;
    }

    updateCounters() {
        // 清除旧的计数器
        this.removeCounters();

        // 获取所有的 callout 元素
        const callouts = document.querySelectorAll('.callout');
        
        callouts.forEach((callout, index) => {
            const counter = createCounterElement();
            counter.textContent = '0';
            
            // 确保 callout 有相对定位，以便正确放置计数器
            if (window.getComputedStyle(callout).position === 'static') {
                (callout as HTMLElement).style.position = 'relative';
            }
            
            callout.appendChild(counter);
            this.counters.set(`counter-${index}`, counter);
        });
    }

    removeCounters() {
        this.counters.forEach(counter => counter.remove());
        this.counters.clear();
    }
} 