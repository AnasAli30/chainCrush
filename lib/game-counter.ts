// Utility functions for tracking games played and scores

export const incrementGamesPlayed = (): number => {
  if (typeof window !== 'undefined') {
    const currentCount = parseInt(localStorage.getItem('candyGamesPlayed') || '0', 10);
    const newCount = currentCount + 1;
    localStorage.setItem('candyGamesPlayed', newCount.toString());
    return newCount;
  }
  return 0;
};

export const getGamesPlayedCount = (): number => {
  if (typeof window !== 'undefined') {
    const storedCount = localStorage.getItem('candyGamesPlayed');
    if (storedCount) {
      const count = parseInt(storedCount, 10);
      if (!isNaN(count) && count >= 0) {
        return count;
      }
    }
  }
  return 0;
};

export const addGameScore = (score: number): void => {
  if (typeof window !== 'undefined' && score >= 0) {
    const storedScores = localStorage.getItem('candyGameScores');
    let scores: number[] = [];
    
    if (storedScores) {
      try {
        scores = JSON.parse(storedScores);
        if (!Array.isArray(scores)) {
          scores = [];
        }
      } catch (error) {
        scores = [];
      }
    }
    
    scores.push(score);
    
    // Keep only the last 100 scores to prevent localStorage from getting too large
    if (scores.length > 100) {
      scores = scores.slice(-100);
    }
    
    localStorage.setItem('candyGameScores', JSON.stringify(scores));
  }
};

export const getAverageScore = (): number => {
  if (typeof window !== 'undefined') {
    const storedScores = localStorage.getItem('candyGameScores');
    if (storedScores) {
      try {
        const scores: number[] = JSON.parse(storedScores);
        if (Array.isArray(scores) && scores.length > 0) {
          const total = scores.reduce((sum, score) => sum + score, 0);
          return Math.round(total / scores.length);
        }
      } catch (error) {
        return 0;
      }
    }
  }
  return 0;
};

export const getBestScore = (): number => {
  if (typeof window !== 'undefined') {
    const storedScores = localStorage.getItem('candyGameScores');
    if (storedScores) {
      try {
        const scores: number[] = JSON.parse(storedScores);
        if (Array.isArray(scores) && scores.length > 0) {
          return Math.max(...scores);
        }
      } catch (error) {
        return 0;
      }
    }
  }
  return 0;
};

export const getTotalGamesFromScores = (): number => {
  if (typeof window !== 'undefined') {
    const storedScores = localStorage.getItem('candyGameScores');
    if (storedScores) {
      try {
        const scores: number[] = JSON.parse(storedScores);
        if (Array.isArray(scores)) {
          return scores.length;
        }
      } catch (error) {
        return 0;
      }
    }
  }
  return 0;
};

export const resetGamesPlayedCount = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('candyGamesPlayed', '0');
    localStorage.removeItem('candyGameScores');
  }
};
