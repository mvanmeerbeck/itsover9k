import { useState, useEffect } from "react";
import { db } from "./db";
import "./App.css";

function App() {
  const [cards, setCards] = useState([]);

  // Charger les cartes au démarrage
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const allCards = await db.cards.orderBy('id').reverse().toArray();

      // Si aucune carte n'existe, charger la collection par défaut
      if (allCards.length === 0) {
        await loadDefaultCollection();
        return;
      }

      // Toujours vérifier les mises à jour du fichier default.json
      await syncWithDefaultCollection();

      // Recharger les cartes après la synchronisation
      const updatedCards = await db.cards.orderBy('id').reverse().toArray();
      setCards(updatedCards);
    } catch (error) {
      console.error("Erreur lors du chargement des cartes:", error);
    }
  };

  const syncWithDefaultCollection = async () => {
    try {
      const response = await fetch("/default.json");

      if (!response.ok) {
        console.log("Fichier default.json non trouvé pour la synchronisation");
        return;
      }

      const defaultCards = await response.json();

      if (Array.isArray(defaultCards) && defaultCards.length > 0) {
        let addedCount = 0;

        for (const cardData of defaultCards) {
          if (cardData.id && cardData.image) {
            let existingCard = await db.cards.get(cardData.id);

            if (!existingCard) {
              // Nouvelle carte trouvée dans default.json
              const newCardData = {
                id: cardData.id,
                image: cardData.image,
                owned: false,
              };

              await db.cards.add(newCardData);
              addedCount++;
            } else {
              // Mise à jour des informations existantes (sauf 'owned')
              const updatedData = {};
              if (cardData.image && cardData.image !== existingCard.image) {
                updatedData.image = cardData.image;
              }

              // Mettre à jour seulement s'il y a des changements
              if (Object.keys(updatedData).length > 0) {
                await db.cards.update(existingCard.id, updatedData);
              }
            }
          }
        }

        if (addedCount > 0) {
          console.log(
            `🆕 ${addedCount} nouvelles cartes ajoutées depuis default.json !`
          );
          // Optionnel: notification utilisateur
          if (addedCount > 0) {
            setTimeout(() => {
              alert(
                `🆕 ${addedCount} nouvelles cartes ont été ajoutées à votre collection !`
              );
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la synchronisation avec default.json:",
        error
      );
    }
  };

  const loadDefaultCollection = async () => {
    try {
      const response = await fetch("/default.json");

      if (!response.ok) {
        console.log("Fichier default.json non trouvé, base vide");
        return;
      }

      const defaultCards = await response.json();

      if (Array.isArray(defaultCards) && defaultCards.length > 0) {
        // Ajouter les cartes par défaut à la base de données
        for (const cardData of defaultCards) {
          if (cardData.id && cardData.image) {
            const newCardData = {
              id: cardData.id,
              image: cardData.image,
              owned: false,
            };

            await db.cards.add(newCardData);
          }
        }

        // Recharger les cartes après l'ajout
        const allCards = await db.cards.orderBy('id').reverse().toArray();
        setCards(allCards);

        console.log(`${defaultCards.length} cartes par défaut chargées !`);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des cartes par défaut:", error);
    }
  };

  const deleteCard = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette carte ?")) {
      try {
        await db.cards.delete(id);
        await loadCards();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const clearAllCards = async () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer toutes les cartes ? La collection par défaut sera rechargée."
      )
    ) {
      try {
        await db.cards.clear();
        await loadCards(); // Cela rechargera automatiquement la collection par défaut
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const toggleOwned = async (id, currentStatus) => {
    try {
      await db.cards.update(id, { owned: !currentStatus });
      // Recharger la liste avec tri direct en query
      const allCards = await db.cards.orderBy('id').reverse().toArray();
      setCards(allCards);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <img src="/thumb_support_item_01800.png" alt="Scouter" style={{width: '48px', height: '48px', marginRight: '15px', verticalAlign: 'middle'}} />
          It's Over 9K!
        </h1>

        {/* Liste des cartes */}
        <div className="cards-section">
          <div className="cards-header">
            <h2>
              {cards.filter((card) => card.owned).length} / {cards.length} cartes - {cards.length > 0
                ? Math.round(
                    (cards.filter((card) => card.owned).length / cards.length) *
                      100
                  )
                : 0}
              %
            </h2>
            <div className="header-buttons">
              {cards.length > 0 && (
                <button onClick={clearAllCards} className="clear-button">
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="no-cards">
              <p>🔄 Chargement de la collection par défaut...</p>
              <p>
                Si vous voyez ce message, ajoutez votre première carte ou
                vérifiez que le fichier default.json existe.
              </p>
            </div>
          ) : (
            <div className="cards-grid">
              {cards.map((card) => (
                <div key={card.id} className="card-container" style={{position: 'relative', display: 'inline-block'}}>
                  <img 
                    src={card.image} 
                    className={`card-image ${card.owned ? 'owned' : 'not-owned'}`}
                    onClick={() => toggleOwned(card.id, card.owned)}
                    title={`Carte ${card.id} - ${card.owned ? 'Possédée' : 'Non possédée'} (cliquez pour changer)`}
                  />
                  <a 
                    href={`https://dokkanessentials.com/Carte-${card.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link"
                    style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: 'rgba(0,0,0,0.7)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: 'white',
                      textDecoration: 'none',
                      opacity: '0.8',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                    title={`Voir la carte ${card.id} sur dokkanessentials.com`}
                  >
                    🔗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
