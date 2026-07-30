// Global Navigation System for AI Commerce OS
const Navigation = {
    // Current module path
    currentPath: window.location.pathname,
    
    // Module definitions with categories
    modules: {
        core: [
            { id: 'command_center', name: 'Pusat Komando', icon: 'command_center', path: 'command_center/code.html' },
            { id: 'ai_business_coach', name: 'AI Business Coach', icon: 'psychology', path: 'ai_business_coach_saran_bisnis/code.html' },
            { id: 'pabrik_konten', name: 'Pabrik Konten AI', icon: 'auto_awesome', path: 'pabrik_konten_ai/code.html' }
        ],
        marketplace: [
            { id: 'integrasi_marketplace', name: 'Integrasi Marketplace', icon: 'api', path: 'integrasi_marketplace_api/code.html' },
            { id: 'supplier_fulfillment', name: 'Supplier & Fulfillment', icon: 'local_shipping', path: 'supplier_fulfillment_hub/code.html' },
            { id: 'manajemen_pesanan', name: 'Manajemen Pesanan', icon: 'inventory_2', path: 'manajemen_pesanan_stok/code.html' }
        ],
        marketing: [
            { id: 'marketing_auto_post', name: 'Marketing Auto Post', icon: 'auto_post', path: 'marketing_auto_post_hub/code.html' },
            { id: 'pabrik_konten_id', name: 'Pabrik Konten ID', icon: 'description', path: 'pabrik_konten_ai_id/code.html' },
            { id: 'affiliate_center', name: 'Affiliate Center', icon: 'group_add', path: 'affiliate_center_automation/code.html' }
        ],
        analytics: [
            { id: 'analitik_eksekutif', name: 'Analitik Eksekutif', icon: 'dashboard', path: 'analitik_eksekutif/code.html' },
            { id: 'customer_intelligence', name: 'Customer Intelligence', icon: 'groups', path: 'customer_intelligence_hub/code.html' },
            { id: 'market_intelligence', name: 'Market Intelligence', icon: 'trending_up', path: 'market_intelligence_engine/code.html' }
        ],
        finance: [
            { id: 'mesin_pendapatan', name: 'Mesin Pendapatan', icon: 'account_balance', path: 'mesin_pendapatan_revenue_engine/code.html' },
            { id: 'laporan_keuangan', name: 'Laporan Keuangan', icon: 'receipt_long', path: 'laporan_keuangan_laba_rugi_otomatis/code.html' }
        ],
        enterprise: [
            { id: 'saas_white_label', name: 'SaaS White Label', icon: 'business', path: 'saas_white_label_center/code.html' },
            { id: 'low_code_builder', name: 'Low Code Builder', icon: 'build', path: 'low_code_app_builder/code.html' },
            { id: 'ekosistem_app_store', name: 'Ekosistem App Store', icon: 'apps', path: 'ekosistem_marketplace_app_store/code.html' }
        ],
        additional: [
            { id: 'sistem_notifikasi', name: 'Sistem Notifikasi', icon: 'notifications', path: 'sistem_notifikasi_wa_telegram/code.html' },
            { id: 'portal_sub_reseller', name: 'Portal Sub-Reseller', icon: 'person_manage', path: 'portal_mandiri_untuk_sub_reseller/code.html' },
            { id: 'aturan_margin', name: 'Aturan Margin', icon: 'rule', path: 'aturan_margin_otomatis_rule_engine/code.html' }
        ]
    },

    // Get current module ID from path
    getCurrentModuleId() {
        const pathParts = this.currentPath.split('/');
        for (let i = pathParts.length - 1; i >= 0; i--) {
            const part = pathParts[i];
            for (const category in this.modules) {
                const module = this.modules[category].find(m => m.path.includes(part));
                if (module) return module.id;
            }
        }
        return null;
    },

    // Navigate to module
    navigateTo(moduleId) {
        for (const category in this.modules) {
            const module = this.modules[category].find(m => m.id === moduleId);
            if (module) {
                // Use absolute path from root to ensure correct navigation regardless of current directory depth
                const targetPath = '/' + module.path.replace(/^\//, '');
                window.location.href = targetPath;
                return;
            }
        }
    },

    // Navigate to home
    navigateHome() {
        // Absolute path to the root index page
        window.location.href = '/index.html';
    },

    // Create sidebar HTML
    createSidebar() {
        const currentModuleId = this.getCurrentModuleId();
        let sidebarHTML = `
            <aside id="global-sidebar" class="fixed left-0 top-0 h-full w-64 bg-surface-container border-r border-outline-variant z-50 transform -translate-x-full transition-transform duration-300">
                <div class="p-4 border-b border-outline-variant">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center">
                            <span class="material-symbols-outlined text-on-primary text-2xl">hub</span>
                        </div>
                        <span class="font-headline-md text-headline-md font-bold text-primary tracking-tighter">AI Commerce OS</span>
                    </div>
                </div>
                <div class="p-4 overflow-y-auto h-[calc(100vh-180px)]">
                    <button onclick="Navigation.navigateHome()" class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-high transition-colors mb-4">
                        <span class="material-symbols-outlined text-primary">home</span>
                        <span class="text-on-surface font-body-md">Dashboard Utama</span>
                    </button>
        `;

        for (const [category, modules] of Object.entries(this.modules)) {
            const categoryNames = {
                core: 'MODUL UTAMA',
                marketplace: 'MARKETPLACE & INTEGRASI',
                marketing: 'MARKETING & KONTEN',
                analytics: 'ANALITIK & INTELIJEN',
                finance: 'PENDAPATAN & KEUANGAN',
                enterprise: 'ENTERPRISE & DEVELOPER',
                additional: 'MODUL TAMBAHAN'
            };

            sidebarHTML += `
                <div class="mb-4">
                    <h3 class="font-label-caps text-label-caps text-on-surface-variant mb-2 text-xs">${categoryNames[category]}</h3>
                    <div class="space-y-1">
            `;

            for (const module of modules) {
                const isActive = module.id === currentModuleId;
                sidebarHTML += `
                    <button onclick="Navigation.navigateTo('${module.id}')" 
                            class="w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${isActive ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container-high text-on-surface'}">
                        <span class="material-symbols-outlined text-lg">${module.icon}</span>
                        <span class="font-body-md text-sm">${module.name}</span>
                    </button>
                `;
            }

            sidebarHTML += `
                    </div>
                </div>
            `;
        }

        sidebarHTML += `
                </div>
                <div class="p-4 border-t border-outline-variant">
                    <button class="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-high transition-colors">
                        <span class="material-symbols-outlined text-primary">settings</span>
                        <span class="text-on-surface font-body-md">Pengaturan</span>
                    </button>
                </div>
            </aside>
            <div id="sidebar-overlay" class="fixed inset-0 bg-black/50 z-40 hidden" onclick="Navigation.toggleSidebar()"></div>
        `;

        return sidebarHTML;
    },

    // Initialize sidebar
    initSidebar() {
        const sidebarContainer = document.createElement('div');
        sidebarContainer.innerHTML = this.createSidebar();
        document.body.appendChild(sidebarContainer);
    },

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('global-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar && overlay) {
            sidebar.classList.toggle('-translate-x-full');
            overlay.classList.toggle('hidden');
        }
    },

    // Add sidebar toggle button to header
    addSidebarToggle() {
        const header = document.querySelector('header');
        if (header) {
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'md:hidden material-symbols-outlined text-on-surface-variant mr-4';
            toggleBtn.textContent = 'menu';
            toggleBtn.onclick = () => this.toggleSidebar();
            const headerContent = header.querySelector('div');
            if (headerContent) {
                headerContent.insertBefore(toggleBtn, headerContent.firstChild);
            }
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Navigation.initSidebar();
    Navigation.addSidebarToggle();
});
