// Dictionnaire misy teny Frantsay ho an'ny ambaratonga rehetra
const baseLetterPools = [
    { letters: ['B', 'I', 'E', 'N'], words: ['BIEN', 'BEN', 'NIE'] },
    { letters: ['A', 'M', 'I', 'S'], words: ['AMIS', 'AMI', 'MAIS', 'SAIS'] },
    { letters: ['C', 'A', 'R', 'E'], words: ['RACE', 'CAR', 'ARE', 'ACRE'] },
    { letters: ['L', 'I', 'R', 'E'], words: ['LIRE', 'LIER', 'RIEL', 'IL'] },
    { letters: ['P', 'A', 'R', 'E'], words: ['RAPE', 'PARE', 'PAR', 'PRE'] },
    { letters: ['N', 'O', 'T', 'E'], words: ['NOTE', 'NET', 'TON', 'ONT'] },
    { letters: ['R', 'A', 'I', 'S'], words: ['RAIS', 'AIRS', 'SAI', 'IRA'] },
    { letters: ['V', 'E', 'N', 'T'], words: ['VENT', 'VERT', 'NET', 'VUE'] },
    { letters: ['M', 'A', 'R', 'I'], words: ['MARI', 'RAMI', 'AMI', 'AIR'] },
    { letters: ['P', 'A', 'I', 'N'], words: ['PAIN', 'PIN', 'PAN', 'ANI'] },
    { letters: ['A', 'R', 'B', 'R', 'E'], words: ['ARBRE', 'RARE', 'BAR', 'BARE'] },
    { letters: ['C', 'H', 'A', 'I', 'R'], words: ['CHAIR', 'CHAR', 'CHAI', 'AIR', 'RICHE'] },
    { letters: ['T', 'R', 'A', 'I', 'N'], words: ['TRAIN', 'RAIN', 'RAIT', 'AIR'] },
    { letters: ['P', 'O', 'R', 'T', 'E'], words: ['PORTE', 'PORT', 'POT', 'POUR', 'TROP'] },
    { letters: ['F', 'L', 'E', 'U', 'R'], words: ['FLEUR', 'FEU', 'FER', 'RUE', 'ELU'] }
];

// Fitehirizana ny mombamomba ny mpilalao rehetra ao amin'ny LocalStorage
const PlayerStorage = {
    get: function(username) {
        let stored = localStorage.getItem(`mdm_user_${username}`);
        return stored ? JSON.parse(stored) : null;
    },
    save: function(username, password, level, score, coins) {
        const data = {
            password: password,
            level: level,
            score: score,
            coins: coins
        };
        localStorage.setItem(`mdm_user_${username}`, JSON.stringify(data));
    }
};

// Mpamorona ny fahasarotan'ny niveau tsirairay hatramin'ny 3000
function generateLevelConfig(levelNumber) {
    const baseIndex = (levelNumber - 1) % baseLetterPools.length;
    const base = baseLetterPools[baseIndex];
    
    // Kisendrasendra voakajy mialoha ho an'ny case kintana
    const starRow = (levelNumber * 3) % base.words.length;
    const starCol = (levelNumber * 2) % base.words[starRow].length;

    return {
        letters: base.letters,
        words: base.words,
        star: { row: starRow, col: starCol }
    };
}
