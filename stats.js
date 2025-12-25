// Statistics Page Controller
class StatsPageController {
    constructor() {
        this.storageKey = 'cardGameStats';
        this.allCombosExpanded = false;

        this.loadAndDisplay();
        this.initializeEventListeners();
    }

    loadStats() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Error loading stats:', e);
            }
        }
        return {
            totalGames: 0,
            totalWins: 0,
            combinations: {}
        };
    }

    initializeEventListeners() {
        // Toggle all combinations
        document.getElementById('toggleAllCombos').addEventListener('click', () => {
            this.allCombosExpanded = !this.allCombosExpanded;
            const allCombos = document.getElementById('allCombinations');
            const toggleText = document.getElementById('toggleText');

            if (this.allCombosExpanded) {
                allCombos.style.display = 'block';
                toggleText.textContent = 'Hide All';
            } else {
                allCombos.style.display = 'none';
                toggleText.textContent = 'Show All';
            }
        });

        // Reset statistics
        document.getElementById('resetStats').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
                localStorage.removeItem(this.storageKey);
                location.reload();
            }
        });
    }

    loadAndDisplay() {
        const data = this.loadStats();

        // Display overall stats
        document.getElementById('totalGames').textContent = data.totalGames;
        document.getElementById('totalWins').textContent = data.totalWins;
        document.getElementById('totalLosses').textContent = data.totalGames - data.totalWins;

        const winRate = data.totalGames > 0
            ? ((data.totalWins / data.totalGames) * 100).toFixed(1)
            : 0;
        document.getElementById('winRate').textContent = winRate + '%';

        // Process combinations
        const combinations = this.processCombinations(data.combinations);

        if (combinations.length === 0) {
            document.getElementById('noCombinationsMessage').style.display = 'block';
            document.getElementById('toggleAllCombos').style.display = 'none';
            return;
        }

        // Display top 5 worst combinations
        this.displayTop5Worst(combinations);

        // Display all combinations
        this.displayAllCombinations(combinations);
    }

    processCombinations(combosData) {
        const combinations = [];

        for (const [combo, stats] of Object.entries(combosData)) {
            const winRate = stats.games > 0
                ? ((stats.wins / stats.games) * 100).toFixed(1)
                : 0;

            combinations.push({
                combination: combo,
                games: stats.games,
                wins: stats.wins,
                losses: stats.games - stats.wins,
                winRate: parseFloat(winRate)
            });
        }

        return combinations;
    }

    displayTop5Worst(combinations) {
        // Sort by win rate (ascending) to get worst performers
        const worst = [...combinations]
            .sort((a, b) => a.winRate - b.winRate)
            .slice(0, 5);

        const container = document.getElementById('top5Worst');

        if (worst.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">No data available yet.</p>';
            return;
        }

        container.innerHTML = worst.map((combo, index) =>
            this.createCombinationCard(combo, index + 1)
        ).join('');
    }

    displayAllCombinations(combinations) {
        // Sort by games played (descending) to show most played first
        const sorted = [...combinations]
            .sort((a, b) => b.games - a.games);

        const container = document.getElementById('allCombinations');

        container.innerHTML = sorted.map((combo, index) =>
            this.createCombinationCard(combo, null)
        ).join('');
    }

    createCombinationCard(combo, rank) {
        const winRateClass = combo.winRate >= 70 ? 'success' :
                            combo.winRate >= 50 ? 'warning' : 'danger';

        const rankBadge = rank ? `<span class="rank-badge rank-${rank}">#${rank}</span>` : '';

        return `
            <div class="combination-card">
                <div class="combo-header">
                    ${rankBadge}
                    <div class="combo-name">${combo.combination}</div>
                    <div class="combo-win-rate ${winRateClass}">${combo.winRate}%</div>
                </div>
                <div class="combo-stats">
                    <div class="combo-stat">
                        <span class="combo-stat-label">Games:</span>
                        <span class="combo-stat-value">${combo.games}</span>
                    </div>
                    <div class="combo-stat">
                        <span class="combo-stat-label">Wins:</span>
                        <span class="combo-stat-value text-success">${combo.wins}</span>
                    </div>
                    <div class="combo-stat">
                        <span class="combo-stat-label">Losses:</span>
                        <span class="combo-stat-value text-danger">${combo.losses}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new StatsPageController();
});
