// Statistics Manager
class Statistics {
    constructor() {
        this.storageKey = 'cardGameStats';
        this.data = this.loadStats();
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
        // Default structure
        return {
            totalGames: 0,
            totalWins: 0,
            combinations: {} // key: "6-4-2-1", value: { games: 0, wins: 0 }
        };
    }

    saveStats() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (e) {
            console.error('Error saving stats:', e);
        }
    }

    // Normalize combination to sorted descending order (e.g., [3,4,3,3] -> "4-3-3-3")
    normalizeCombination(counts) {
        const sortedCounts = Object.values(counts).sort((a, b) => b - a);
        return sortedCounts.join('-');
    }

    recordGame(counts, isCorrect) {
        this.data.totalGames++;
        if (isCorrect) {
            this.data.totalWins++;
        }

        // Track combination stats
        const combo = this.normalizeCombination(counts);
        if (!this.data.combinations[combo]) {
            this.data.combinations[combo] = { games: 0, wins: 0 };
        }
        this.data.combinations[combo].games++;
        if (isCorrect) {
            this.data.combinations[combo].wins++;
        }

        this.saveStats();
    }

    getStats() {
        return {
            totalGames: this.data.totalGames,
            totalWins: this.data.totalWins,
            winPercentage: this.data.totalGames > 0
                ? ((this.data.totalWins / this.data.totalGames) * 100).toFixed(1)
                : 0,
            combinations: this.data.combinations
        };
    }

    resetStats() {
        this.data = {
            totalGames: 0,
            totalWins: 0,
            combinations: {}
        };
        this.saveStats();
    }
}

// Card Game Logic
class CardGame {
    constructor() {
        this.suits = {
            spades: { name: 'Spades', symbol: '♠', class: 'spades' },
            hearts: { name: 'Hearts', symbol: '♥', class: 'hearts' },
            diamonds: { name: 'Diamonds', symbol: '♦', class: 'diamonds' },
            clubs: { name: 'Clubs', symbol: '♣', class: 'clubs' }
        };
        
        this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        
        // Rank values for sorting (Ace highest to 2 lowest)
        this.rankValues = {
            'A': 14,
            'K': 13,
            'Q': 12,
            'J': 11,
            '10': 10,
            '9': 9,
            '8': 8,
            '7': 7,
            '6': 6,
            '5': 5,
            '4': 4,
            '3': 3,
            '2': 2
        };
        
        this.deck = [];
        this.drawnCards = [];
        this.hiddenSuit = null;
        this.correctAnswer = 0;
        this.score = 0;
        this.timer = null;
        this.baseTime = 7.0;
        this.timeRemaining = 7.0;
        this.timerInterval = null;
        this.consecutiveCorrect = 0;
        
        this.initializeDeck();
    }
    
    initializeDeck() {
        this.deck = [];
        for (const suitKey in this.suits) {
            for (const rank of this.ranks) {
                this.deck.push({
                    rank: rank,
                    suit: suitKey,
                    suitData: this.suits[suitKey]
                });
            }
        }
    }
    
    shuffleDeck() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    drawCards(count = 13) {
        this.initializeDeck();
        this.shuffleDeck();
        this.drawnCards = this.deck.slice(0, count);
        return this.drawnCards;
    }
    
    groupAndSortCards() {
        const grouped = {
            spades: [],
            hearts: [],
            diamonds: [],
            clubs: []
        };
        
        // Group cards by suit
        this.drawnCards.forEach(card => {
            grouped[card.suit].push(card);
        });
        
        // Sort each suit from Ace (highest) to 2 (lowest)
        for (const suit in grouped) {
            grouped[suit].sort((a, b) => {
                return this.rankValues[b.rank] - this.rankValues[a.rank];
            });
        }
        
        return grouped;
    }
    
    getCardCounts() {
        const counts = {
            spades: 0,
            hearts: 0,
            diamonds: 0,
            clubs: 0
        };
        
        this.drawnCards.forEach(card => {
            counts[card.suit]++;
        });
        
        return counts;
    }
    
    selectRandomHiddenSuit() {
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        this.hiddenSuit = suits[Math.floor(Math.random() * suits.length)];
        const counts = this.getCardCounts();
        this.correctAnswer = counts[this.hiddenSuit];
        return this.hiddenSuit;
    }

    startTimer(callback) {
        this.timeRemaining = this.baseTime;
        this.timerInterval = setInterval(() => {
            this.timeRemaining -= 0.1;
            if (this.timeRemaining <= 0) {
                this.stopTimer();
                callback('timeout');
            }
        }, 100);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    adjustTimerForCorrect() {
        this.consecutiveCorrect++;
        if (this.consecutiveCorrect >= 2) {
            this.baseTime = Math.max(2.0, this.baseTime - 0.1);
            this.consecutiveCorrect = 0;
        }
    }
    
    adjustTimerForIncorrect() {
        this.baseTime = Math.min(15.0, this.baseTime + 0.1);
        this.consecutiveCorrect = 0;
    }
    
    resetGame() {
        this.stopTimer();
        this.timeRemaining = this.baseTime;
    }
}

// UI Controller
class UIController {
    constructor(game, stats) {
        this.game = game;
        this.stats = stats;
        this.cardsContainer = document.getElementById('cardsContainer');
        this.drawButton = document.getElementById('drawCards');
        this.showCardsToggle = document.getElementById('showCardsToggle');
        this.cardsSection = document.getElementById('cardsSection');
        this.trumpSection = document.getElementById('trumpSection');
        this.gameStatus = document.getElementById('gameStatus');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.gameHeader = document.getElementById('gameHeader');
        this.answerButtons = document.querySelectorAll('.btn-answer');
        this.resultSection = document.getElementById('resultSection');
        this.resultMessage = document.getElementById('resultMessage');
        this.nextRoundButton = document.getElementById('nextRound');
        this.hiddenSuitName = document.getElementById('hiddenSuitName');

        this.gameActive = false;
        this.currentCombination = null; // Store current game's combination for stats

        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        this.drawButton.addEventListener('click', () => {
            this.startNewGame();
        });
        
        this.showCardsToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.cardsContainer.style.display = 'block';
            } else {
                this.cardsContainer.style.display = 'none';
            }
        });
        
        this.answerButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.gameActive) {
                    this.handleAnswer(parseInt(btn.dataset.value));
                }
            });
        });
        
        this.nextRoundButton.addEventListener('click', () => {
            this.startNewGame();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            // Handle number keys for answers
            const key = e.key;

            if (this.gameActive) {
                const numPressed = parseInt(key);

                // Check if the pressed number is 0-9
                if (!isNaN(numPressed) && numPressed >= 0 && numPressed <= 9) {
                    this.handleAnswer(numPressed);
                }
            }

            // Handle spacebar for next round
            if (key === ' ' && this.resultSection.style.display !== 'none') {
                e.preventDefault(); // Prevent page scroll
                this.startNewGame();
            }
        });
    }
    
    startNewGame() {
        // Reset game state
        this.game.resetGame();
        this.gameActive = true;
        
        // Hide result section
        this.resultSection.style.display = 'none';
        
        // Hide header when game starts
        this.gameHeader.style.display = 'none';
        
        // Don't reset toggle - keep user's preference
        // Just update cards visibility based on current toggle state
        if (this.showCardsToggle.checked) {
            this.cardsContainer.style.display = 'block';
        } else {
            this.cardsContainer.style.display = 'none';
        }
        
        // Draw cards
        this.game.drawCards(13);
        
        // Display cards
        this.displayCards();
        
        // Show sections
        this.cardsSection.style.display = 'block';
        this.trumpSection.style.display = 'block';
        this.gameStatus.style.display = 'block';
        
        // Select random suit to hide
        const hiddenSuit = this.game.selectRandomHiddenSuit();

        // Store current combination for statistics
        this.currentCombination = this.game.getCardCounts();

        // Update counts and hide one
        this.updateCounts(hiddenSuit);
        
        // Update hidden suit name
        const suitData = this.game.suits[hiddenSuit];
        this.hiddenSuitName.innerHTML = `${suitData.symbol} ${suitData.name}`;

        // Reset all answer buttons
        this.answerButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });

        // Update score display
        this.scoreDisplay.textContent = `Score: ${this.game.score}`;
        
        // Start timer
        this.game.startTimer((result) => {
            if (result === 'timeout') {
                this.handleTimeout();
            }
        });
        
        this.updateTimerDisplay();
    }
    
    updateTimerDisplay() {
        if (!this.gameActive) return;
        
        const time = Math.max(0, this.game.timeRemaining).toFixed(1);
        this.timerDisplay.textContent = `${time}s`;
        
        if (this.game.timeRemaining <= 1.5) {
            this.timerDisplay.classList.add('warning');
        } else {
            this.timerDisplay.classList.remove('warning');
        }
        
        if (this.gameActive) {
            requestAnimationFrame(() => this.updateTimerDisplay());
        }
    }
    
    displayCards() {
        this.cardsContainer.innerHTML = '';
        
        const groupedCards = this.game.groupAndSortCards();
        
        // Create single row for all cards
        const cardsRow = document.createElement('div');
        cardsRow.className = 'cards-row';
        
        // Display cards grouped by suit in order: spades, hearts, diamonds, clubs
        const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs'];
        
        suitOrder.forEach(suit => {
            const cards = groupedCards[suit];
            
            cards.forEach((card, index) => {
                const cardElement = this.createCardElement(card, index);
                cardsRow.appendChild(cardElement);
            });
        });
        
        this.cardsContainer.appendChild(cardsRow);
    }
    
    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = `card-item ${card.suit}`;
        cardDiv.style.animationDelay = `${index * 0.05}s`;
        
        const rankSpan = document.createElement('div');
        rankSpan.className = 'card-rank';
        rankSpan.textContent = card.rank;
        
        const suitSpan = document.createElement('div');
        suitSpan.className = 'card-suit';
        suitSpan.textContent = card.suitData.symbol;
        
        cardDiv.appendChild(rankSpan);
        cardDiv.appendChild(suitSpan);
        
        return cardDiv;
    }
    
    updateCounts(hiddenSuit) {
        const counts = this.game.getCardCounts();

        // Update all count displays
        for (const suit in counts) {
            const countElement = document.getElementById(`count-${suit}`);
            const boxElement = document.getElementById(`box-${suit}`);

            if (countElement && boxElement) {
                countElement.textContent = counts[suit];

                // Hide the selected suit count
                if (suit === hiddenSuit) {
                    boxElement.classList.add('hidden');
                } else {
                    boxElement.classList.remove('hidden');
                }
            }
        }

        // Sort boxes: biggest to smallest, with hidden suit last
        this.sortAndReorderBoxes(counts, hiddenSuit);
    }

    sortAndReorderBoxes(counts, hiddenSuit) {
        // Get all suit boxes with their parent container
        const trumpSection = document.querySelector('#trumpSection .row');
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];

        // Create array of suits with their counts and elements
        const suitData = suits.map(suit => ({
            suit: suit,
            count: counts[suit],
            element: document.getElementById(`box-${suit}`).parentElement, // Get the col-6 col-md-3 wrapper
            isHidden: suit === hiddenSuit
        }));

        // Separate hidden suit from others
        const hiddenSuitData = suitData.find(s => s.isHidden);
        const visibleSuits = suitData.filter(s => !s.isHidden);

        // Sort visible suits by count (descending - biggest to smallest)
        visibleSuits.sort((a, b) => b.count - a.count);

        // Add hidden suit at the end
        const sortedSuits = [...visibleSuits, hiddenSuitData];

        // Reorder the DOM elements
        sortedSuits.forEach(data => {
            trumpSection.appendChild(data.element);
        });
    }

    handleAnswer(selectedAnswer) {
        this.gameActive = false;
        this.game.stopTimer();

        const isCorrect = selectedAnswer === this.game.correctAnswer;

        // Record statistics
        if (this.currentCombination) {
            this.stats.recordGame(this.currentCombination, isCorrect);
        }

        // Adjust timer for next round
        if (isCorrect) {
            this.game.adjustTimerForCorrect();
        } else {
            this.game.adjustTimerForIncorrect();
        }
        
        // Disable all buttons and mark them
        this.answerButtons.forEach(btn => {
            const value = parseInt(btn.dataset.value);
            btn.disabled = true;
            
            if (value === this.game.correctAnswer) {
                btn.classList.add('correct');
            } else if (value === selectedAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
        });
        
        // Reveal the hidden count
        const boxElement = document.getElementById(`box-${this.game.hiddenSuit}`);
        boxElement.classList.remove('hidden');
        
        // Update score
        if (isCorrect) {
            this.game.score++;
        }
        
        // Show result
        setTimeout(() => {
            this.showResult(isCorrect ? 'correct' : 'incorrect');
        }, 1000);
    }
    
    handleTimeout() {
        this.gameActive = false;

        // Record statistics (timeout counts as incorrect)
        if (this.currentCombination) {
            this.stats.recordGame(this.currentCombination, false);
        }

        // Timeout is treated as incorrect - adjust timer
        this.game.adjustTimerForIncorrect();
        
        // Disable all buttons and mark correct answer
        this.answerButtons.forEach(btn => {
            const value = parseInt(btn.dataset.value);
            btn.disabled = true;
            
            if (value === this.game.correctAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // Reveal the hidden count
        const boxElement = document.getElementById(`box-${this.game.hiddenSuit}`);
        boxElement.classList.remove('hidden');
        
        // Show result
        setTimeout(() => {
            this.showResult('timeout');
        }, 500);
    }
    
    showResult(resultType) {
        const messages = {
            correct: '🎉 Correct! Well done!',
            incorrect: '❌ Wrong answer. Try again!',
            timeout: '⏰ Time\'s up! Be faster next time!'
        };
        
        this.resultMessage.innerHTML = `
            ${messages[resultType]}
            <div style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.8;">
                Press SPACE for next round
            </div>
        `;
        this.resultMessage.className = `result-message ${resultType}-result`;
        this.resultSection.style.display = 'block';
        
        // Update score display
        this.scoreDisplay.textContent = `Score: ${this.game.score}`;
        
        // Scroll to bottom and focus on next round button
        setTimeout(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
            this.nextRoundButton.focus();
        }, 100);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const stats = new Statistics();
    const game = new CardGame();
    const ui = new UIController(game, stats);

    // Expose stats to window for stats page
    window.gameStats = stats;
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
