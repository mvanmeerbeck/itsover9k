import { useState, useEffect } from 'react';
import { db } from './db';

// Hook personnalisé pour gérer les cartes
export const useCards = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger toutes les cartes
  const loadCards = async () => {
    try {
      setLoading(true);
      const allCards = await db.cards.orderBy('id').reverse().toArray();
      setCards(allCards);
      setError(null);
    } catch (err) {
      setError('Erreur lors du chargement des cartes');
      console.error('Erreur loadCards:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une carte
  const addCard = async (cardData) => {
    try {
      const id = await db.cards.add({
        name: cardData.name,
        image: cardData.image || 'https://via.placeholder.com/200x300?text=Carte',
        createdAt: new Date()
      });
      await loadCards(); // Recharger la liste
      return id;
    } catch (err) {
      setError('Erreur lors de l\'ajout de la carte');
      console.error('Erreur addCard:', err);
      throw err;
    }
  };

  // Supprimer une carte
  const deleteCard = async (id) => {
    try {
      await db.cards.delete(id);
      await loadCards(); // Recharger la liste
    } catch (err) {
      setError('Erreur lors de la suppression de la carte');
      console.error('Erreur deleteCard:', err);
      throw err;
    }
  };

  // Supprimer toutes les cartes
  const clearAllCards = async () => {
    try {
      await db.cards.clear();
      await loadCards(); // Recharger la liste
    } catch (err) {
      setError('Erreur lors de la suppression des cartes');
      console.error('Erreur clearAllCards:', err);
      throw err;
    }
  };

  // Rechercher des cartes
  const searchCards = async (searchTerm) => {
    try {
      if (!searchTerm.trim()) {
        await loadCards();
        return;
      }
      
      const searchResults = await db.cards
        .filter(card => card.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .toArray();
      
      setCards(searchResults);
    } catch (err) {
      setError('Erreur lors de la recherche');
      console.error('Erreur searchCards:', err);
    }
  };

  // Charger les cartes au montage du composant
  useEffect(() => {
    loadCards();
  }, []);

  return {
    cards,
    loading,
    error,
    addCard,
    deleteCard,
    clearAllCards,
    searchCards,
    refreshCards: loadCards
  };
};

// Hook pour obtenir des statistiques
export const useCardStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    withImages: 0,
    withoutImages: 0
  });

  const updateStats = async () => {
    try {
      const total = await db.cards.count();
      const withImages = await db.cards.filter(card => 
        card.image && !card.image.includes('placeholder')
      ).count();
      
      setStats({
        total,
        withImages,
        withoutImages: total - withImages
      });
    } catch (err) {
      console.error('Erreur updateStats:', err);
    }
  };

  useEffect(() => {
    updateStats();
    
    // Écouter les changements dans la base de données
    const interval = setInterval(updateStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { stats, updateStats };
};
