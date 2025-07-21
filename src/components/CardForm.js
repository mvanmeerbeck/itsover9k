import { useState } from 'react';
import './CardForm.css';

const CardForm = ({ onAddCard, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    image: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la carte est requis';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Le nom doit contenir au moins 2 caractères';
    }

    if (formData.image && !isValidUrl(formData.image)) {
      newErrors.image = 'L\'URL de l\'image n\'est pas valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onAddCard(formData);
      setFormData({ name: '', image: '' });
      setErrors({});
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Effacer l'erreur quand l'utilisateur tape
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const presetImages = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
    'https://images.unsplash.com/photo-1617626775135-dde87c82e56b?w=400'
  ];

  return (
    <div className="card-form">
      <h2>🃏 Ajouter une nouvelle carte</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">
            Nom de la carte <span className="required">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Goku, Vegeta, Pikachu..."
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="image">URL de l'image (optionnel)</label>
          <input
            id="image"
            name="image"
            type="url"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://exemple.com/image.jpg"
            className={errors.image ? 'error' : ''}
          />
          {errors.image && <span className="error-message">{errors.image}</span>}
          
          <div className="preset-images">
            <p>Ou choisissez une image prédéfinie :</p>
            <div className="preset-grid">
              {presetImages.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Preset ${index + 1}`}
                  className="preset-image"
                  onClick={() => setFormData(prev => ({ ...prev, image: url }))}
                />
              ))}
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="submit-button"
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Ajout en cours...
            </>
          ) : (
            '✨ Ajouter la carte'
          )}
        </button>
      </form>
    </div>
  );
};

export default CardForm;
