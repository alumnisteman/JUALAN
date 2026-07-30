$html = Get-Content -Path "otomatisasi_alur_kerja_bpmn\code.html" -Raw

$oldNav = @'
<nav class="flex-1 px-3 mt-4 space-y-1">
<div class="text-[11px] font-code-label text-outline px-3 mb-2 uppercase tracking-widest">Triggers</div>
<div class="flex items-center gap-3 px-3 py-3 bg-secondary-container/20 text-secondary-fixed-dim border-l-2 border-secondary font-code-label text-[13px] group cursor-pointer transition-all duration-200">
<span class="material-symbols-outlined text-[20px]">hub</span>
<span>Event Bus</span>
</div>
<div class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">schedule</span>
<span>Scheduler</span>
</div>
<div class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">webhook</span>
<span>Webhook</span>
</div>
<div class="text-[11px] font-code-label text-outline px-3 mt-8 mb-2 uppercase tracking-widest">Actions</div>
<div class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">chat</span>
<span>WhatsApp API</span>
</div>
<div class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">mail</span>
<span>Email Service</span>
</div>
<div class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">payments</span>
<span>Payment Gateway</span>
</div>
<div class="flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">database</span>
<span>ERP Integration</span>
</div>
</nav>
'@

$newNav = @'
<nav class="flex-1 px-3 mt-4 space-y-1">
<div class="text-[11px] font-code-label text-outline px-3 mb-2 uppercase tracking-widest">Pemicu (Triggers)</div>
<div data-type="Trigger" data-name="Bus Acara" data-icon="hub" data-color="text-tertiary" data-border="border-t-primary/50" class="sidebar-item flex items-center gap-3 px-3 py-3 bg-secondary-container/20 text-secondary-fixed-dim border-l-2 border-secondary font-code-label text-[13px] group cursor-pointer transition-all duration-200 hover:bg-secondary-container/40">
<span class="material-symbols-outlined text-[20px]">hub</span>
<span>Bus Acara (Event Bus)</span>
</div>
<div data-type="Trigger" data-name="Penjadwal" data-icon="schedule" data-color="text-tertiary" data-border="border-t-primary/50" class="sidebar-item flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">schedule</span>
<span>Penjadwal (Scheduler)</span>
</div>
<div data-type="Trigger" data-name="Webhook API" data-icon="webhook" data-color="text-tertiary" data-border="border-t-primary/50" class="sidebar-item flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">webhook</span>
<span>Webhook API</span>
</div>
<div class="text-[11px] font-code-label text-outline px-3 mt-8 mb-2 uppercase tracking-widest">Aksi (Actions)</div>
<div data-type="Action" data-name="API WhatsApp" data-icon="chat" data-color="text-secondary" data-border="border-l-secondary" class="sidebar-item flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">chat</span>
<span>API WhatsApp</span>
</div>
<div data-type="Action" data-name="Layanan Email" data-icon="mail" data-color="text-primary" data-border="border-l-primary" class="sidebar-item flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">mail</span>
<span>Layanan Email</span>
</div>
<div data-type="Action" data-name="Gerbang Pembayaran" data-icon="payments" data-color="text-green-400" data-border="border-l-green-400" class="sidebar-item flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">payments</span>
<span>Gerbang Pembayaran</span>
</div>
<div data-type="Action" data-name="Integrasi ERP" data-icon="database" data-color="text-tertiary" data-border="border-l-tertiary" class="sidebar-item flex items-center gap-3 px-3 py-3 text-on-surface-variant hover:bg-surface-container-high font-code-label text-[13px] group cursor-pointer transition-all">
<span class="material-symbols-outlined text-[20px]">database</span>
<span>Integrasi ERP</span>
</div>
</nav>
'@

$oldScript = @'
    <script>
        // Simple micro-interaction for dragging nodes (visual only)
        const nodes = document.querySelectorAll('.glass-panel.cursor-grab');
        nodes.forEach(node => {
            node.addEventListener('mousedown', (e) => {
                node.style.cursor = 'grabbing';
                node.classList.add('ring-2', 'ring-primary/50');
            });
            node.addEventListener('mouseup', () => {
                node.style.cursor = 'grab';
                node.classList.remove('ring-2', 'ring-primary/50');
            });
        });

        // ---------------- AI Simulation Logic ----------------
'@

$newScript = @'
    <script>
        // Setup Toast Notifications for interactions
        function showNodeToast(msg) {
            const existingToast = document.querySelector('.node-toast');
            if(existingToast) existingToast.remove();
            
            const toast = document.createElement('div');
            toast.className = 'node-toast fixed top-24 right-8 bg-surface-container-high border border-outline-variant text-on-surface px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 font-body-sm text-[13px] transition-all duration-300';
            toast.style.transform = 'translateY(-20px)';
            toast.style.opacity = '0';
            toast.innerHTML = `<span class="material-symbols-outlined text-primary">info</span> <span>${msg}</span>`;
            document.body.appendChild(toast);
            
            requestAnimationFrame(() => {
                toast.style.transform = 'translateY(0)';
                toast.style.opacity = '1';
            });
            
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-10px)';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        function makeDraggable(node) {
            let isDragging = false;
            let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

            node.addEventListener('mousedown', dragStart);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('mousemove', drag);

            function dragStart(e) {
                const style = window.getComputedStyle(node);
                const matrix = new WebKitCSSMatrix(style.transform);
                xOffset = matrix.m41;
                yOffset = matrix.m42;
                
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
                if (e.target === node || node.contains(e.target)) {
                    isDragging = true;
                    node.style.cursor = 'grabbing';
                    node.classList.add('ring-2', 'ring-primary/50', 'z-50');
                }
            }

            function dragEnd(e) {
                if(!isDragging) return;
                initialX = currentX;
                initialY = currentY;
                isDragging = false;
                node.style.cursor = 'grab';
                node.classList.remove('ring-2', 'ring-primary/50', 'z-50');
            }

            function drag(e) {
                if (isDragging) {
                    e.preventDefault();
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                    xOffset = currentX;
                    yOffset = currentY;
                    node.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
                }
            }
        }
        
        document.querySelectorAll('.glass-panel.cursor-grab').forEach(makeDraggable);

        const canvasContainer = document.querySelector('.absolute.inset-0.p-12');
        let newNodesCount = 0;

        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const type = item.dataset.type;
                const name = item.dataset.name;
                const icon = item.dataset.icon;
                const color = item.dataset.color;
                const border = item.dataset.border || 'border-t-primary/50';
                
                document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('bg-secondary-container/20', 'border-l-2', 'border-secondary', 'text-secondary-fixed-dim'));
                item.classList.add('bg-secondary-container/20', 'border-l-2', 'border-secondary', 'text-secondary-fixed-dim');
                
                if (name === "API WhatsApp") {
                    showNodeToast(`Menghubungkan <span class="font-bold text-primary">Sistem Notifikasi WA/Telegram</span>...`);
                } else if (name === "Integrasi ERP") {
                    showNodeToast(`Mengambil skema data dari <span class="font-bold text-primary">Integrasi Marketplace API</span>...`);
                } else if (name === "Layanan Email") {
                    showNodeToast(`Sinkronisasi dengan <span class="font-bold text-primary">Hub Dukungan Pelanggan AI</span>...`);
                } else if (name === "Penjadwal (Scheduler)") {
                    showNodeToast(`Terhubung ke <span class="font-bold text-primary">Pusat Komando Event-Driven</span>...`);
                } else if (name === "Gerbang Pembayaran") {
                    showNodeToast(`Sinkronisasi dengan <span class="font-bold text-primary">Laporan Keuangan & Laba Rugi</span>...`);
                } else {
                    showNodeToast(`Menambahkan komponen <span class="font-bold">${name}</span> ke kanvas...`);
                }

                const newNode = document.createElement('div');
                const leftPos = 150 + (newNodesCount * 180) % 600;
                const topPos = 300 + Math.floor(newNodesCount / 4) * 120;
                
                newNode.className = `absolute glass-panel w-44 p-4 rounded-xl shadow-xl border-t-4 ${border} hover:border-primary transition-all cursor-grab`;
                newNode.style.left = leftPos + 'px';
                newNode.style.top = topPos + 'px';
                
                newNode.innerHTML = `
                    <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined ${color} text-[18px]">${icon}</span>
                        <span class="text-[10px] font-code-label text-outline uppercase tracking-tighter">${type}</span>
                    </div>
                    <div class="text-sm font-bold text-on-surface">${name}</div>
                    <div class="mt-2 text-[11px] text-on-surface-variant italic">Klik untuk mengatur...</div>
                    <div class="mt-2 flex justify-between items-center">
                        <span class="text-[10px] px-1.5 py-0.5 bg-surface-container-high text-primary rounded border border-primary/20">DRAFT</span>
                        <div class="w-3 h-3 rounded-full bg-outline-variant"></div>
                    </div>
                `;
                
                canvasContainer.appendChild(newNode);
                makeDraggable(newNode);
                
                if(typeof addActivityLog === 'function') {
                    addActivityLog(`Added node: ${name}`, 'add_circle', 'text-primary');
                }
                
                newNodesCount++;
            });
        });

        // ---------------- AI Simulation Logic ----------------
'@

$oldNavClean = $oldNav -replace "`r`n", "`n"
$newNavClean = $newNav -replace "`r`n", "`n"
$oldScriptClean = $oldScript -replace "`r`n", "`n"
$newScriptClean = $newScript -replace "`r`n", "`n"

$htmlClean = $html -replace "`r`n", "`n"

$htmlClean = $htmlClean.Replace($oldNavClean, $newNavClean)
$htmlClean = $htmlClean.Replace($oldScriptClean, $newScriptClean)

Set-Content -Path "otomatisasi_alur_kerja_bpmn\code.html" -Value $htmlClean
Write-Host "Injected without regex!"
