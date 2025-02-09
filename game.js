class SecretNumberGame {
  constructor() {
    this.minRange = 0;
    this.maxRange = 100;
    this.playerCount = 2;
    this.currentPlayerIndex = 0;
    this.players = [];
    this.playerAvatars = [];
    this.secretNumber = null;
    this.currentMinRange = null;
    this.currentMaxRange = null;
    this.avatarLoadPromises = [];

    this.initializeEventListeners();
  }

  async generateAvatar(seed) {
    try {
      const pokemonId = Math.floor(Math.random() * 898) + 1;
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const pokemonData = await response.json();

      return {
        name: pokemonData.name,
        sprite: pokemonData.sprites.front_default,
        colors: this.getColorPaletteFromSprite(pokemonData.sprites.front_default)
      };
    } catch (error) {
      console.error('Failed to fetch Pokémon:', error);
      const emojis = ['🤠', '🚀', '🌟', '🍄', '🎲', '🌈', '🍦', '🐸', '🤖', '🍩'];
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', 
        '#6C5CE7', '#A8E6CF', '#FF8ED4', '#FAD390'
      ];

      const emoji = emojis[seed % emojis.length];
      const color = colors[seed % colors.length];

      return { emoji, color };
    }
  }

  generateSecretNumber(min, max) {
    // 確保密碼不能是範圍的上限和下限
    const availableNumbers = [];
    for (let i = min + 1; i < max; i++) {
      availableNumbers.push(i);
    }
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    return availableNumbers[randomIndex];
  }

  generateSecretNumber(min, max) {
    // 確保密碼不能是範圍的上限和下限
    const availableNumbers = [];
    for (let i = min + 1; i < max; i++) {
      availableNumbers.push(i);
    }
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    return availableNumbers[randomIndex];
  }

  showCelebrationMessage(winningPlayer) {
    const celebrationContainer = document.createElement('div');
    celebrationContainer.style.position = 'fixed';
    celebrationContainer.style.top = '0';
    celebrationContainer.style.left = '0';
    celebrationContainer.style.width = '100%';
    celebrationContainer.style.height = '100%';
    celebrationContainer.style.zIndex = '1000';
    celebrationContainer.style.display = 'flex';
    celebrationContainer.style.flexDirection = 'column';
    celebrationContainer.style.justifyContent = 'center';
    celebrationContainer.style.alignItems = 'center';
    celebrationContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
    celebrationContainer.style.color = 'white';
    celebrationContainer.style.fontFamily = 'Arial, sans-serif';
    celebrationContainer.style.textAlign = 'center';

    // Winner announcement
    const winnerMessage = document.createElement('h1');
    winnerMessage.textContent = `🏆 The winner is ${winningPlayer}, who correctly guessed the secret number: ${this.secretNumber}! 🎉`;
    winnerMessage.style.fontSize = '2.5rem';
    winnerMessage.style.marginBottom = '20px';

    // Confetti animation (similar to previous implementation)
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.overflow = 'hidden';

    // Create multiple confetti elements
    for (let i = 0; i < 200; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = '10px';
      confetti.style.height = '10px';
      confetti.style.borderRadius = '50%';
      
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#fdcb6e', '#6c5ce7', '#a8e6cf', '#ff8ed4', '#fad390'];
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      confetti.style.left = `${Math.random() * 100}%`;
      
      confetti.animate([
        { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 2000 + Math.random() * 1000,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        delay: Math.random() * 1000
      });

      confettiContainer.appendChild(confetti);
    }

    celebrationContainer.appendChild(winnerMessage);
    celebrationContainer.appendChild(confettiContainer);
    document.body.appendChild(celebrationContainer);
    
    // Remove celebration after 5 seconds
    setTimeout(() => {
      document.body.removeChild(celebrationContainer);
      this.resetGame();
    }, 5000);
  }

  showLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.remove('hidden');
  }

  hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    loadingOverlay.classList.add('hidden');
  }

}

// Initialize the game
window.game = new SecretNumberGame();