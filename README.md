# Vislice Na črko

`Vislice Na črko` je statična brskalniška igra brez zaledja. Projekt je pripravljen za objavo na GitHub Pages in uporablja samo relativne poti, zato deluje tudi, ko je objavljen v podmapi repozitorija.

## Zgradba

- `index.html` naloži eno igralno stran.
- `styles.css` vsebuje celoten vizualni slog in responsive postavitev.
- `src/main.js` inicializira igro.
- `src/game/` vsebuje stanje igre, logiko kroga, tipkovnico in `localStorage` pomočnike.
- `src/ui/na-crko-svg.js` generira SVG risbo vislic.
- `src/data/na-crko-data.js` vsebuje lokalne slovenske podatke po kategorijah.

## Lokalni zagon

Odpri `index.html` v brskalniku ali za razvoj zaženi poljuben statični strežnik v korenu projekta.

## Objava na GitHub Pages

1. Potisni projekt na vejo `main`.
2. Na GitHubu odpri `Settings` -> `Pages`.
3. Izberi `Deploy from a branch`.
4. Nastavi vejo `main` in mapo `/root`.
5. Shrani in počakaj na objavo.

## Opombe za Pages

- Vstopna datoteka uporablja `./styles.css` in `./src/main.js`, ne absolutnih poti.
- Aplikacija ne uporablja hardcodanih `localhost`, `127.0.0.1` ali lokalnih disk poti.
- Ker ni odvisna od build koraka, jo lahko GitHub Pages postreže neposredno iz repozitorija.
