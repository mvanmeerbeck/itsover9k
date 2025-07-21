const fs = require('fs');
const https = require('https');
const path = require('path');

// Créer le dossier images s'il n'existe pas
const imagesDir = './public/images';
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Fonction pour télécharger une image avec gestion des erreurs
function downloadImage(id, retryCount = 0) {
  return new Promise((resolve) => {
    const filename = `card${id}.png`;
    const filePath = path.join(imagesDir, filename);
    const url = `https://dokkanessentials.com/img/thumb/card${id}.png`;
    
    // Vérifier si l'image existe déjà localement
    if (fs.existsSync(filePath)) {
      console.log(`⏭️  ${id}: Existe déjà`);
      resolve({ id, success: true, status: 'exists' });
      return;
    }

    console.log(`📥 ${id}: Téléchargement...`);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ ${id}: Téléchargé`);
          resolve({ id, success: true, status: 'downloaded' });
        });
      } else if (response.statusCode === 302) {
        // Image n'existe pas - ignorer
        fs.unlink(filePath, () => {});
        console.log(`❌ ${id}: N'existe pas (302)`);
        resolve({ id, success: false, status: 'not_found', code: 302 });
      } else if (response.statusCode === 429) {
        // Rate limit - attendre et réessayer
        fs.unlink(filePath, () => {});
        console.log(`⏳ ${id}: Rate limit - Retry dans 3s...`);
        setTimeout(async () => {
          const result = await downloadImage(id, retryCount + 1);
          resolve(result);
        }, 3000);
      } else {
        // Autre erreur
        fs.unlink(filePath, () => {});
        console.log(`❌ ${id}: Erreur ${response.statusCode}`);
        resolve({ id, success: false, status: 'error', code: response.statusCode });
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.log(`❌ ${id}: Erreur réseau`);
      resolve({ id, success: false, status: 'network_error' });
    });
    
    file.on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.log(`❌ ${id}: Erreur fichier`);
      resolve({ id, success: false, status: 'file_error' });
    });
  });
}

async function main() {
  console.log('🚀 Début du téléchargement séquentiel...');
  console.log('⏱️  Rythme: 1 image par seconde');
  console.log('� Plage: IDs 1 à 2277\n');

  const results = [];
  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  // Télécharger une image par seconde, de 2277 à 1
  for (let id = 18; id >= 1; id--) {
    const result = await downloadImage(id);
    results.push(result);
    
    if (result.success) successCount++;
    else if (result.code === 302) notFoundCount++;
    else errorCount++;
    
    // Afficher le progrès tous les 50 téléchargements
    if (id % 50 === 0) {
      console.log(`📊 Progrès: ${id}/2277 (${Math.round(id/2277*100)}%) - ✅${successCount} ❌${notFoundCount} ⚠️${errorCount}`);
    }
    
    // Attendre 1 seconde avant la prochaine image (sauf pour la dernière)
    if (id < 2277) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Créer le fichier default.json avec toutes les images valides
  console.log('\n📝 Création du fichier default.json...');
  const validCards = results
    .filter(r => r.success)
    .map(result => ({
      id: result.id,
      image: `/images/card${result.id}.png`
    }))
    .sort((a, b) => a.id - b.id);

  // Sauvegarder l'ancien fichier s'il existe
  if (fs.existsSync('./public/default.json')) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync('./public/default.json', `./public/default.json.backup-${timestamp}`);
    console.log(`📁 Ancien fichier sauvé: default.json.backup-${timestamp}`);
  }

  // Écrire le nouveau fichier
  fs.writeFileSync('./public/default.json', JSON.stringify(validCards, null, 2));

  console.log('\n✅ Processus terminé !');
  console.log(`📄 Fichier default.json créé avec ${validCards.length} cartes valides`);
  console.log(`� Statistiques finales:`);
  console.log(`   ✅ Images téléchargées: ${successCount}`);
  console.log(`   ❌ Images inexistantes: ${notFoundCount}`);
  console.log(`   ⚠️  Autres erreurs: ${errorCount}`);
}

// Gestion propre de l'arrêt du script
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt demandé par l\'utilisateur...');
  process.exit(0);
});

main().catch(console.error);
