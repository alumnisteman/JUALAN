// Market Intelligence Engine Logic

document.addEventListener('DOMContentLoaded', () => {
    initMarketIntel();
});

async function initMarketIntel() {
    // 1. Fetch data
    const [trends, competitors, alerts] = await Promise.all([
        API.fetch('/api/intelligence/category-trends'),
        API.fetch('/api/intelligence/top-competitors'),
        API.fetch('/api/intelligence/alerts')
    ]);

    // 2. Populate Trends
    if (trends && trends.length > 0) {
        populateTrends(trends);
    }

    // 3. Populate Alerts
    if (alerts && alerts.length > 0) {
        populateAlerts(alerts);
    }

    // 4. Populate Competitor Benchmarking
    if (competitors && competitors.length > 0) {
        populateCompetitors(competitors);
    }

    // 5. Setup Price History Chart logic (Simulation based on average market price)
    setupPriceHistoryChart();
}

function populateTrends(trends) {
    const trendContainer = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-3.gap-4');
    if (!trendContainer) return;
    
    // Warna untuk visual
    const colors = ['market-growth', 'intelligence-score', 'tertiary-fixed-dim'];
    const icons = ['arrow_upward', 'horizontal_rule', 'arrow_upward'];

    trendContainer.innerHTML = trends.map((t, i) => {
        const c = colors[i % colors.length];
        const icon = icons[i % icons.length];
        const score = t.normalized_score || Math.round(Math.random() * 40 + 60);

        return `
            <div class="bg-surface-container-high p-4 rounded-lg border border-outline-variant hover:border-primary transition-all group">
                <div class="flex justify-between items-center mb-3">
                    <span class="font-label-caps text-[10px] text-outline uppercase">${t.category || 'UNKNOWN'}</span>
                    <span class="material-symbols-outlined text-${c}" data-icon="${icon}">${icon}</span>
                </div>
                <div class="flex items-end gap-2 mb-2">
                    <span class="font-display-lg text-display-lg text-${c} ${score > 80 ? 'score-glow' : ''}">${score}</span>
                    <span class="font-label-caps text-label-caps text-outline-variant pb-2">/100</span>
                </div>
                <div class="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                    <div class="bg-${c} h-full" style="width: ${score}%"></div>
                </div>
                <p class="mt-3 text-[12px] text-on-surface-variant">Products Sold: ${t.total_sold.toLocaleString('id-ID')}</p>
            </div>
        `;
    }).join('');
}

function populateAlerts(alerts) {
    const alertContainer = document.querySelector('.space-y-4.overflow-y-auto');
    if (!alertContainer) return;

    alertContainer.innerHTML = alerts.map(a => `
        <div class="bg-${a.severity}/10 border border-${a.severity}/30 p-4 rounded-lg relative overflow-hidden group hover:bg-${a.severity}/20 transition-all cursor-pointer">
            <div class="absolute top-0 left-0 h-full w-1 bg-${a.severity}"></div>
            <div class="flex justify-between items-start mb-2">
                <span class="font-label-caps text-[10px] text-${a.severity}">${a.type}</span>
                <span class="font-data-mono text-[10px] text-outline">${a.time}</span>
            </div>
            <p class="text-body-sm font-semibold mb-1">${a.title}</p>
            <p class="text-[12px] text-on-surface-variant">${a.desc}</p>
        </div>
    `).join('');
}

function populateCompetitors(competitors) {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    // Calculate total products for market share estimation
    const totalMarket = competitors.reduce((sum, c) => sum + parseInt(c.total_sold), 0);
    const colors = ['primary', 'secondary', 'tertiary', 'primary-container', 'error'];

    tbody.innerHTML = competitors.map((c, i) => {
        const rating = parseFloat(c.avg_rating) || 0;
        const color = colors[i % colors.length];
        const initial = c.shop_name.charAt(0).toUpperCase();
        const share = totalMarket > 0 ? ((parseInt(c.total_sold) / totalMarket) * 100).toFixed(1) : '0.0';

        let stars = '';
        for (let j = 1; j <= 5; j++) {
            const fill = j <= Math.round(rating) ? 1 : 0;
            stars += `<span class="material-symbols-outlined text-[16px]" data-icon="star" style="font-variation-settings: 'FILL' ${fill};">star</span>`;
        }

        let statusHtml = '';
        if (share > 30) {
            statusHtml = `<span class="px-2 py-0.5 bg-tertiary-container/10 text-tertiary-container text-[10px] border border-tertiary-container/30 rounded">DOMINANT</span>`;
        } else if (share > 15) {
            statusHtml = `<span class="px-2 py-0.5 bg-primary-container/10 text-primary-container text-[10px] border border-primary-container/30 rounded">STABLE</span>`;
        } else {
            statusHtml = `<span class="px-2 py-0.5 bg-risk-danger/10 text-risk-danger text-[10px] border border-risk-danger/30 rounded">CHALLENGER</span>`;
        }

        // Dummy avg response time based on rating
        const responseTime = rating > 4.8 ? '0.8 hrs' : (rating > 4.5 ? '1.2 hrs' : '3.5 hrs');

        return `
            <tr class="border-b border-outline-variant/10 hover:bg-primary/5 transition-colors group">
                <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-surface-bright rounded flex items-center justify-center font-bold text-${color}">${initial}</div>
                        <span class="truncate max-w-[150px] block" title="${c.shop_name}">${c.shop_name}</span>
                        <span class="text-[10px] bg-surface-container px-1 rounded text-outline">${c.marketplace}</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex text-intelligence-score">
                        ${stars}
                    </div>
                </td>
                <td class="py-4 px-4">${share}%</td>
                <td class="py-4 px-4">${responseTime}</td>
                <td class="py-4 px-4">
                    ${statusHtml}
                </td>
                <td class="py-4 px-4 text-right">
                    <button class="material-symbols-outlined text-outline hover:text-primary" data-icon="more_vert">more_vert</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function setupPriceHistoryChart() {
    // We simulate price chart dynamically around the average price
    const stats = await API.getStats();
    if (!stats || stats.length === 0) return;
    
    // Get total average price
    const sumPrice = stats.reduce((acc, s) => acc + parseFloat(s.avg_price), 0);
    const avgPrice = sumPrice / stats.length;

    const chartContainer = document.querySelector('.h-48.w-full.relative.flex.items-end.justify-between');
    if (!chartContainer) return;

    // Generate 12 bars representing 30 days history
    let barsHtml = '';
    let previousHeight = 50;

    for (let i = 0; i < 12; i++) {
        // Random walk around 30% to 90% height
        let height = previousHeight + (Math.random() * 20 - 10);
        height = Math.max(30, Math.min(90, height));
        previousHeight = height;

        const simulatedPrice = (avgPrice * (height / 60)).toFixed(0);
        
        let extraHtml = '';
        let colorClass = 'bg-primary/20 hover:bg-primary';

        // Add special markers to a few bars
        if (i === 8) {
            colorClass = 'bg-primary hover:bg-primary';
            extraHtml = `
            <div class="absolute -top-12 left-1/2 -translate-x-1/2 text-risk-danger flex flex-col items-center">
                <span class="material-symbols-outlined text-[16px]" data-icon="trending_down">trending_down</span>
                <span class="font-label-caps text-[10px]">DIP</span>
            </div>`;
        }

        barsHtml += `
        <div class="w-[8%] ${colorClass} h-[${Math.round(height)}%] rounded-t-sm transition-all relative group">
            <div class="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-data-mono z-10 whitespace-nowrap">
                Rp ${Number(simulatedPrice).toLocaleString('id-ID')}
            </div>
            ${extraHtml}
        </div>
        `;
    }

    chartContainer.innerHTML = barsHtml;
}
