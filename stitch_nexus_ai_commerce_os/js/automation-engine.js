/**
 * AI Commerce OS - Global Automation Engine
 * This engine runs in the background of all modules, bringing the UI to life
 * with simulated real-time data, notifications, and AI processing effects.
 */

const AutomationEngine = {
    config: {
        toastIntervalMin: 15000, // 15 seconds min
        toastIntervalMax: 45000, // 45 seconds max
        statUpdateInterval: 8000, // 8 seconds
        aiProcessingInterval: 25000, // 25 seconds
    },

    state: {
        toastContainer: null,
        statElements: [],
        intervals: []
    },

    init() {
        console.log("🚀 [Automation Engine] Initializing live features...");
        
        // Give DOM time to settle before hijacking elements
        setTimeout(() => {
            this.setupToastContainer();
            this.identifyStatElements();
            
            // Start cycles
            this.startToastCycle();
            this.startStatUpdateCycle();
            this.startAIProcessingCycle();
            this.startTableAnimationCycle();
        }, 1500);
    },

    // ==============================================
    // 1. Toast Notification System
    // ==============================================
    setupToastContainer() {
        let container = document.getElementById('ai-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ai-toast-container';
            container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none';
            document.body.appendChild(container);
        }
        this.state.toastContainer = container;
    },

    showToast(title, message, type = 'info') {
        if (!this.state.toastContainer) return;

        const toast = document.createElement('div');
        
        // Define styles based on type
        let icon = 'info';
        let bgClass = 'bg-surface-container-high';
        let borderClass = 'border-outline-variant';
        let textClass = 'text-on-surface';
        let iconClass = 'text-primary';

        if (type === 'success') {
            icon = 'check_circle';
            borderClass = 'border-tertiary';
            iconClass = 'text-tertiary';
        } else if (type === 'warning') {
            icon = 'warning';
            borderClass = 'border-error';
            iconClass = 'text-error';
        } else if (type === 'order') {
            icon = 'shopping_cart_checkout';
            borderClass = 'border-primary';
            iconClass = 'text-primary';
        }

        toast.className = `flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md pointer-events-auto transform translate-y-8 opacity-0 transition-all duration-500 ease-out ${bgClass} ${borderClass}`;
        
        toast.innerHTML = `
            <span class="material-symbols-outlined mt-0.5 ${iconClass}" style="font-variation-settings: 'FILL' 1;">${icon}</span>
            <div class="flex-1">
                <h4 class="font-label-caps text-[11px] mb-1 ${textClass} opacity-80">${title}</h4>
                <p class="font-body-sm ${textClass}">${message}</p>
            </div>
            <button class="material-symbols-outlined text-on-surface-variant text-[18px] hover:text-on-surface ml-2" onclick="this.parentElement.remove()">close</button>
        `;

        this.state.toastContainer.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-8', 'opacity-0');
        });

        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-8', 'opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 5000);
    },

    startToastCycle() {
        const loop = () => {
            if (window.DummyData) {
                // Generate a random dynamic notification
                const r = Math.random();
                if (r < 0.5) {
                    // New Order
                    const product = window.DummyData.getRandom(window.DummyData.products);
                    const customer = window.DummyData.getRandom(window.DummyData.customers);
                    const platform = window.DummyData.getRandom(window.DummyData.marketplaces).name;
                    this.showToast(
                        'PESANAN BARU', 
                        `<strong>${customer.name}</strong> baru saja membeli <span class="text-tertiary">${product.name}</span> via ${platform}.`, 
                        'order'
                    );
                } else if (r < 0.75) {
                    // Stock Warning
                    const product = window.DummyData.getRandom(window.DummyData.products);
                    this.showToast(
                        'PERINGATAN STOK', 
                        `Sisa stok <strong>${product.name}</strong> menipis (Tersisa: ${Math.floor(Math.random() * 5) + 1} unit).`, 
                        'warning'
                    );
                } else {
                    // System Info
                    this.showToast(
                        'AI SYSTEM UPDATE', 
                        'Harga dinamis telah diperbarui berdasarkan tren kompetitor terkini.', 
                        'success'
                    );
                }
            } else {
                this.showToast('SISTEM AKTIF', 'AI Commerce OS sedang memantau operasi Anda.', 'info');
            }

            const nextInterval = Math.random() * (this.config.toastIntervalMax - this.config.toastIntervalMin) + this.config.toastIntervalMin;
            setTimeout(loop, nextInterval);
        };
        
        setTimeout(loop, 5000); // initial delay
    },

    // ==============================================
    // 2. Live Stat Numbers
    // ==============================================
    identifyStatElements() {
        // Find elements that look like they hold numbers (especially large ones)
        const candidates = document.querySelectorAll('.font-display-lg, .font-display-md, .text-\\[32px\\], .text-4xl');
        
        candidates.forEach(el => {
            const text = el.textContent.trim();
            // Check if it's a number (can have commas, dots, Rp, etc)
            if (/^(Rp\s*)?[\d\.\,]+(rb|jt|m|b)?$/i.test(text) && !text.includes('%') && text.length > 0) {
                this.state.statElements.push({
                    element: el,
                    originalText: text,
                    // Parse base value crudely
                    isCurrency: text.includes('Rp'),
                    suffix: text.match(/[a-z]+$/i)?.[0] || ''
                });
            }
        });
    },

    startStatUpdateCycle() {
        const intervalId = setInterval(() => {
            if (this.state.statElements.length === 0) return;

            // Pick 1-3 random stats to update
            const numUpdates = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numUpdates; i++) {
                const statObj = this.state.statElements[Math.floor(Math.random() * this.state.statElements.length)];
                this.animateStatChange(statObj);
            }
        }, this.config.statUpdateInterval);
        this.state.intervals.push(intervalId);
    },

    animateStatChange(statObj) {
        const el = statObj.element;
        const text = el.textContent.trim();
        
        // Extract raw number part
        const numStr = text.replace(/[^0-9]/g, '');
        if (!numStr) return;
        
        let num = parseInt(numStr, 10);
        
        // Increase it slightly (simulating growth/sales)
        const increase = Math.floor(Math.random() * 5) + 1;
        num += increase;
        
        // Reformat (very crude implementation that handles Indonesian formatting)
        let newText = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        
        if (statObj.isCurrency) {
            newText = "Rp " + newText;
        }
        if (statObj.suffix) {
            // Keep the suffix but maybe we just increased the base unit, 
            // handling "jt" or "rb" is tricky without parsing float, 
            // for simplicity, we just add a green flash if we can't parse safely.
        }

        // Apply green flash effect to element
        const originalColor = el.style.color;
        el.style.color = 'var(--md-sys-color-tertiary, #4ade80)'; // green glow
        el.style.transition = 'color 0.3s ease-out';
        
        // If it was a simple number without suffix, update it
        if (!statObj.suffix && numStr.length === text.replace(/[^0-9]/g, '').length) {
            el.textContent = newText;
        }

        setTimeout(() => {
            el.style.color = originalColor;
            setTimeout(() => {
                el.style.transition = '';
            }, 300);
        }, 1000);
    },

    // ==============================================
    // 3. Simulated AI Processing Background Tasks
    // ==============================================
    startAIProcessingCycle() {
        // Randomly target "glass-panel" or "bento-card" to show a processing overlay
        const intervalId = setInterval(() => {
            const panels = document.querySelectorAll('.glass-panel, .bento-card, .bg-surface-container');
            if (panels.length === 0) return;
            
            const target = panels[Math.floor(Math.random() * panels.length)];
            
            // Avoid panels that already have it or are too small
            if (target.querySelector('.ai-processing-overlay') || target.clientHeight < 100) return;

            // Ensure relative positioning
            if (window.getComputedStyle(target).position === 'static') {
                target.style.position = 'relative';
            }
            target.style.overflow = 'hidden';

            const overlay = document.createElement('div');
            overlay.className = 'ai-processing-overlay absolute inset-0 bg-surface-container/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300';
            overlay.innerHTML = `
                <span class="material-symbols-outlined text-primary text-3xl animate-spin" style="font-variation-settings: 'FILL' 1;">sync</span>
                <span class="font-data-mono text-xs text-primary mt-2">AI Mengoptimalkan...</span>
            `;

            target.appendChild(overlay);

            // Fade in
            requestAnimationFrame(() => overlay.classList.remove('opacity-0'));

            // Remove after a few seconds
            setTimeout(() => {
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.remove(), 300);
            }, 3000 + Math.random() * 2000);

        }, this.config.aiProcessingInterval);
        
        this.state.intervals.push(intervalId);
    },

    // ==============================================
    // 4. Table/List Dynamic Injection
    // ==============================================
    startTableAnimationCycle() {
        // Find tables or lists and insert rows to simulate live data
        setInterval(() => {
            // Find lists that have hover effects (common in this project's UI)
            const listItems = document.querySelectorAll('.hover\\:bg-surface-container-high, .hover\\:bg-surface-container');
            if (listItems.length === 0) return;
            
            const randomItem = listItems[Math.floor(Math.random() * listItems.length)];
            const parent = randomItem.parentElement;
            
            // Ensure parent isn't just the body and has multiple similar children
            if (parent && parent.children.length > 2 && parent.tagName !== 'BODY') {
                // Clone the item
                const clone = randomItem.cloneNode(true);
                
                // Slightly modify text if possible to make it look new
                const timeEl = clone.querySelector('.text-on-surface-variant');
                if (timeEl && timeEl.textContent.includes('lalu')) {
                    timeEl.textContent = 'Baru saja';
                }

                // Prepare for animation
                clone.style.maxHeight = '0px';
                clone.style.opacity = '0';
                clone.style.overflow = 'hidden';
                clone.style.transition = 'all 0.5s ease-out';
                clone.classList.add('bg-primary-container/20'); // Highlight color

                // Insert at top
                parent.insertBefore(clone, parent.firstChild);

                // Animate in
                requestAnimationFrame(() => {
                    clone.style.maxHeight = '100px';
                    clone.style.opacity = '1';
                });

                // Remove highlight after a while
                setTimeout(() => {
                    clone.classList.remove('bg-primary-container/20');
                    clone.style.maxHeight = ''; // restore to auto
                    clone.style.overflow = '';
                }, 2000);

                // Remove oldest item to keep list length stable
                if (parent.children.length > 8) {
                    const last = parent.lastChild;
                    if (last && last.style) {
                        last.style.transition = 'all 0.5s ease-out';
                        last.style.opacity = '0';
                        last.style.transform = 'translateY(10px)';
                        setTimeout(() => last.remove(), 500);
                    }
                }
            }
        }, 35000); // Every 35 seconds
    }
};

// Start the engine automatically when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AutomationEngine.init());
} else {
    AutomationEngine.init();
}

// Expose globally
window.AI_Commerce_Automation = AutomationEngine;
