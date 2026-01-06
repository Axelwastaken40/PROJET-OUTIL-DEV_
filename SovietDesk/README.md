# Soviet Desk - Prototype

Un jeu de gestion de régime autoritaire soviétique. Le joueur dirige depuis son bureau en gérant les factions, les dossiers critiques et les événements aléatoires.

## Fonctionnalités actuelles (v0.1.0)

- **Gestion des dossiers** : reçois des dossiers critiques chaque jour. Signe, refuse ou retarde.
- **5 Factions** : Armée, Police secrète, Peuple, Parti, Scientifiques. Chacune a une influence, loyauté et satisfaction.
- **3 Jauges globales** : Paranoïa, Stabilité, Ressources.
- **Conséquences dynamiques** : chaque décision change les jauges et les états des factions.
- **Journal de bord** : suivi de toutes les actions et événements.
- **Conditions de défaite** : effondrement gouvernemental, paranoïa extrême, coup d'état.

## Structure du projet

```
SovietDesk/
├── data/
│   ├── dossiers.json          # Liste des dossiers à signer
│   └── events.json            # Événements aléatoires
├── scripts/
│   ├── GameState.gd           # Logique de jeu (factions, gauges, conséquences)
│   └── Main.gd                # UI principale
├── scenes/
│   └── main.tscn              # Scène Godot principale
└── project.godot              # Configuration du projet
```

## Installation & Lancement

### Prérequis
- Godot 4.x (gratuit, https://godotengine.org)

### Étapes
1. Télécharge Godot 4.x
2. Dans Godot, sélectionne "Importer" et choisis le dossier `SovietDesk`
3. Ouvre le projet et clique "Jouer" (▶ F5)

### Alternative (sans Godot)
- Si tu ne veux pas installer Godot maintenant, je peux convertir le jeu en version web (HTML5 + Canvas) ou en Python/Pygame pour démarrage immédiat. Dis-moi !

## Gameplay

### Boucle quotidienne
1. **Morning Brief** : reçois 3 dossiers critiques.
2. **Décisions** : pour chaque dossier, clique sur le titre pour voir les détails.
3. **Actions** : signe, refuse ou retarde.
4. **Conséquences** : observe les changements de factions et de jauges.
5. **Next Day** : quand tous les dossiers sont traités, clique "NEXT DAY".

### Jauges & Factions
- **Paranoïa** : augmente avec les décisions répressives. Au-delà de 100 → game over.
- **Stabilité** : au-dessous de 0 → effondrement gouvernemental.
- **Ressources** : budget secret. Les projets scientifiques coûtent cher.

Chaque faction a 3 états :
- **Influence** : pouvoir pratique (si > 75 et loyauté < 25 → coup d'état).
- **Loyauté** : disposition à obéir.
- **Satisfaction** : ressentiment interne.

## Fichiers de données (JSON)

### dossiers.json
Structure d'un dossier :
```json
{
  "id": "dos_001",
  "title": "Allocate Military Funds",
  "description": "...",
  "source": "Ministry of Defence",
  "urgency": 8,
  "risk": 3,
  "benefit": 5,
  "linked_faction": "Army",
  "consequences": {
    "if_signed": { "Army_influence": 10, "paranoia": 2 },
    "if_refused": { "Army_loyalty": -8, "stability": -3 }
  }
}
```

Chaque conséquence peut modifier :
- Jauges globales : `paranoia`, `stability`, `resources`
- États de factions : `Army_influence`, `SecretPolice_loyalty`, etc.

### events.json
Événements aléatoires qui se déclenchent selon :
- `probability` : chance par jour (0.0..1.0).
- `trigger_condition` : condition booléenne (optionnel).
- `consequences` : effets si événement déclenché.

## Prochaines étapes (TODO)

- [ ] Mini-jeux (déchiffrage, interrogatoire)
- [ ] UI améliorée (images, animations, son)
- [ ] Système de propagande (machine à écrire)
- [ ] Objets du bureau interactifs (téléphone, radio, coffre-fort)
- [ ] Sauvegarde / chargement de jeu
- [ ] Fins multiples selon trajet du joueur
- [ ] Mode pas-à-pas (tour-based) vs temps réel

## Contribuer

Si tu veux modifier les dossiers ou événements :
1. Édite `data/dossiers.json` ou `data/events.json`
2. Le jeu charge ces fichiers au démarrage — pas besoin de recompiler.

Pour ajouter des mécaniques :
1. Modifie `scripts/GameState.gd` (logique)
2. Modifie `scripts/Main.gd` (UI)
3. Relance le jeu (F5 dans Godot).

## Notes de design

- Tous les nombres (influence, loyauté, etc.) sont dans [0..100].
- Les conséquences sont "clampées" (limitées) pour éviter sortir des limites.
- Le jeu check les conditions de défaite après chaque action.
- Le journal de bord (log) conserve les 50 derniers événements.

---

**Version** : 0.1.0  
**Langue** : GDScript (Godot)  
**Plateforme** : Godot 4.x (Windows, macOS, Linux)  
**État** : Prototype jouable avec mécaniques de base.
