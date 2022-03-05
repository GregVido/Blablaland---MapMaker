# Blablaland - MapMaker

## C'est quoi ?

<p>
MapMaker est un outil permettant de créer des maps sans forcement savoir programmer en ActionScript 3.<br>
Il ouvre un serveur web sur un port spécifique afin de pouvoir générer une map directement par un site internet.
</p>

## Ce que le developpeur doit savoir

### Comment l'implémenter ?

<p>
Rien de plus compliquer, avec un petit bout de code, on peut facilement l'implémenter avec NodeJS.
</p>

```js
const Api = require("./API");

// On créer l'API
const api = new Api({
    PORT: 80, // le port sur lequel on veut ouvrir le serveur web
    CORE: "./jpexs/ffdec.bat" // le fichier .bat (Windows) ou .sh (Linux) de ffdec
});

// On la lance
api.init();
```

### Valider une map
La validation n'est pas encore disponible au grand publique ^.^

## Ce que l'utilisateur doit savoir

### L'environnement, c'est quoi ?

C'est les interaction qu'un joueur peut avoir sur la map, c'est-à-dire la nage, la grimpe, une porte ...

### Je ne trouve pas comment ajouter mon image ...
Là aussi, c'est peut être pas évident pour tous le monde, mais il faut juste double cliquer sur l'emplacement de la map.

### Je veux ajouter des colisions

Il y a deux moyens d'ajouter des collisions:<br>

- Importer depuis une image avec le bouton "Charger une collision ?" à droite

- Les dessiner soit même en cliquant sur le bouton "Dessiner des collisions ?" ce qui activera le mode dessin, et vous pourrez avec la souris dessiné sur la map.

### J'ai un fichier bizzare en .swf

Il suffit juste de le faire remonter à un Administrateur de rétro pour qu'il décide de l'integrer au jeu ou non.