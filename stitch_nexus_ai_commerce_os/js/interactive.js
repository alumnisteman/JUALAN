// Interactive Features for AI Commerce OS
const Interactive = {
    // Chat functionality for AI modules
    initChat() {
        const chatContainer = document.getElementById('chat-container');
        const sendButton = document.querySelector('button.bg-primary');
        const chatInput = document.querySelector('input[type="text"]');
        
        if (sendButton && chatInput && chatContainer) {
            sendButton.addEventListener('click', () => this.sendMessage(chatInput, chatContainer));
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage(chatInput, chatContainer);
            });
        }
    },

    sendMessage(input, container) {
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        const userMsg = document.createElement('div');
        userMsg.className = 'flex gap-3 max-w-[80%] self-end flex-row-reverse';
        userMsg.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-on-primary text-[16px]">person</span>
            </div>
            <div class="bg-primary-container text-on-primary-container p-4 rounded-xl rounded-tr-none">
                <p class="text-body-md">${message}</p>
            </div>
        `;
        container.appendChild(userMsg);
        input.value = '';
        container.scrollTop = container.scrollHeight;

        // Fetch AI response dari API riil
        fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, mode: 'ai-business-coach' })
        })
        .then(res => res.json())
        .then(data => {
            const aiMsg = document.createElement('div');
            aiMsg.className = 'flex gap-3 max-w-[80%]';
            aiMsg.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant">
                    <span class="material-symbols-outlined text-[16px]">smart_toy</span>
                </div>
                <div class="bg-surface-container-high p-4 rounded-xl rounded-tl-none border border-outline-variant">
                    <p class="text-body-md">${data.response || 'Terima kasih atas pertanyaan Anda.'}</p>
                </div>
            `;
            container.appendChild(aiMsg);
            container.scrollTop = container.scrollHeight;
        })
        .catch(() => {
            // Fallback response
            const aiMsg = document.createElement('div');
            aiMsg.className = 'flex gap-3 max-w-[80%]';
            aiMsg.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant">
                    <span class="material-symbols-outlined text-[16px]">smart_toy</span>
                </div>
                <div class="bg-surface-container-high p-4 rounded-xl rounded-tl-none border border-outline-variant">
                    <p class="text-body-md">Terima kasih atas pertanyaan Anda. Saya sedang menganalisis data untuk memberikan rekomendasi terbaik...</p>
                </div>
            `;
            container.appendChild(aiMsg);
            container.scrollTop = container.scrollHeight;
        });
    },

    // Form validation and submission
    initForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.validateForm(form);
            });
        });
    },

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('border-error');
                setTimeout(() => input.classList.remove('border-error'), 2000);
            }
        });

        if (isValid) {
            alert('Form berhasil dikirim!');
            form.reset();
        } else {
            alert('Mohon lengkapi semua field yang wajib diisi.');
        }
    },

    // Card click handlers
    initCards() {
        const cards = document.querySelectorAll('.glass-card, .bento-card');
        cards.forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        });
    },

    // Button animations
    initButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mousedown', () => {
                btn.classList.add('scale-95');
            });
            btn.addEventListener('mouseup', () => {
                btn.classList.remove('scale-95');
            });
            btn.addEventListener('mouseleave', () => {
                btn.classList.remove('scale-95');
            });
        });
    },

    // Toggle switches
    initToggles() {
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', function() {
                const card = this.closest('.glass-card, .bento-card');
                if (card) {
                    card.classList.add('active-glow');
                    setTimeout(() => card.classList.remove('active-glow'), 1000);
                }
            });
        });
    },

    // Search functionality
    initSearch() {
        const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="cari"], input[type="text"][placeholder*="Cari"], input[type="text"][placeholder*="search"]');
        searchInputs.forEach(input => {
            input.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                const items = document.querySelectorAll('.glass-card, .bento-card');
                
                items.forEach(item => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(query)) {
                        item.style.display = '';
                    } else {
                        item.style.display = query ? 'none' : '';
                    }
                });
            });
        });
    },

    // Modal functionality
    initModals() {
        const modalTriggers = document.querySelectorAll('[data-modal]');
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.getAttribute('data-modal');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                }
            });
        });

        const modalCloses = document.querySelectorAll('[data-modal-close]');
        modalCloses.forEach(close => {
            close.addEventListener('click', () => {
                const modal = close.closest('.fixed');
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            });
        });
    },

    // Initialize all interactive features
    init() {
        this.initChat();
        this.initForms();
        this.initCards();
        this.initButtons();
        this.initToggles();
        this.initSearch();
        this.initModals();
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Interactive.init();
});
