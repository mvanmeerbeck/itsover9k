import Dexie from 'dexie';

export const db = new Dexie('itsover9k');

db.version(1).stores({
  cards: '++id, name, image, owned'
});

// Hook pour ouvrir la base de données
db.open().catch((error) => {
  console.error('Erreur lors de l\'ouverture de la base de données:', error);
});

// Export des fonctions utilitaires
export const cardUtils = {
  // Obtenir toutes les cartes triées par ID
  getAllCards: () => db.cards.orderBy('id').toArray(),
  
  // Rechercher des cartes par nom
  searchByName: (name) => db.cards.filter(card => 
    card.name.toLowerCase().includes(name.toLowerCase())
  ).toArray(),
  
  // Obtenir les statistiques
  getStats: async () => {
    const total = await db.cards.count();
    const owned = await db.cards.filter(card => card.owned === true).count();
    
    return { total, owned };
  }
};