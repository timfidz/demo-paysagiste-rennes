// Comportements communs du site : menu, bannière cookies, formulaire de devis, avant/après, filtres
(function () {
  "use strict";

  // En-tête : ombre au défilement
  const entete = document.querySelector(".entete");
  const majEntete = () => entete && entete.classList.toggle("defile", window.scrollY > 8);
  window.addEventListener("scroll", majEntete, { passive: true });
  majEntete();

  // Menu mobile et sous-menu des services
  const boutonMenu = document.querySelector(".bouton-menu");
  const nav = document.querySelector(".nav");
  if (boutonMenu && nav) {
    boutonMenu.addEventListener("click", () => {
      const ouvert = nav.classList.toggle("ouvert");
      boutonMenu.setAttribute("aria-expanded", String(ouvert));
    });
    // Échap referme le menu
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("ouvert")) { boutonMenu.click(); boutonMenu.focus(); }
    });
  }
  const sousMenus = document.querySelectorAll(".sous-menu");
  const fermerSousMenus = () => sousMenus.forEach((m) => {
    m.classList.remove("ouvert");
    m.querySelector(".ouvrir-sous-menu").setAttribute("aria-expanded", "false");
  });
  document.querySelectorAll(".ouvrir-sous-menu").forEach((b) => b.addEventListener("click", () => {
    const ouvert = b.parentElement.classList.toggle("ouvert");
    b.setAttribute("aria-expanded", String(ouvert));
  }));
  // Un clic ailleurs ou la touche Échap referme le menu des services
  document.addEventListener("click", (e) => { if (!e.target.closest(".sous-menu")) fermerSousMenus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { fermerSousMenus(); if (document.activeElement.closest(".sous-menu")) document.activeElement.blur(); } });

  // Consentement cookies : choix conservé 6 mois (recommandation CNIL), refuser aussi simple qu'accepter
  const CLE = "consentement-cookies";
  const DUREE = 1000 * 60 * 60 * 24 * 182;
  const lireChoix = () => {
    try {
      const choix = JSON.parse(localStorage.getItem(CLE));
      return choix && Date.now() - choix.date < DUREE ? choix : null;
    } catch { return null; }
  };
  // La mesure d'audience ne se charge qu'après accord explicite
  const appliquer = (choix) => {
    if (choix && choix.mesure && !window.__mesureChargee) {
      window.__mesureChargee = true;
      // Emplacement du script de statistiques : non chargé dans la démonstration
    }
  };
  const enregistrerChoix = (mesure) => {
    const choix = { mesure, date: Date.now() };
    try { localStorage.setItem(CLE, JSON.stringify(choix)); } catch {}
    appliquer(choix);
  };
  const banniere = document.querySelector(".cookies");
  if (banniere) {
    const detail = banniere.querySelector(".cookies-detail");
    const caseMesure = banniere.querySelector("#mesure-audience");
    const montrer = () => {
      const choix = lireChoix();
      if (caseMesure) caseMesure.checked = !!(choix && choix.mesure);
      banniere.classList.add("visible");
    };
    const cacher = () => { banniere.classList.remove("visible"); detail.classList.remove("ouvert"); };
    banniere.querySelector("[data-cookies='accepter']").addEventListener("click", () => { enregistrerChoix(true); cacher(); });
    banniere.querySelector("[data-cookies='refuser']").addEventListener("click", () => { enregistrerChoix(false); cacher(); });
    banniere.querySelector("[data-cookies='personnaliser']").addEventListener("click", () => detail.classList.toggle("ouvert"));
    banniere.querySelector("[data-cookies='enregistrer']").addEventListener("click", () => { enregistrerChoix(caseMesure.checked); cacher(); });
    document.querySelectorAll("[data-gerer-cookies]").forEach((b) => b.addEventListener("click", montrer));
    const choix = lireChoix();
    if (choix) appliquer(choix); else montrer();
  }

  // Démonstration : chantiers ajoutés depuis l'écran « Ajouter un chantier », gardés dans ce navigateur seulement.
  // Sur le vrai site, ils sont enregistrés dans WordPress et visibles par tous.
  const CLE_CHANTIERS = "chantiers-ajoutes";
  const lireChantiers = () => { try { return JSON.parse(localStorage.getItem(CLE_CHANTIERS)) || []; } catch { return []; } };
  const ecrireChantiers = (liste) => localStorage.setItem(CLE_CHANTIERS, JSON.stringify(liste));
  const el = (balise, classe, texte) => { const e = document.createElement(balise); if (classe) e.className = classe; if (texte) e.textContent = texte; return e; };
  const image = (src, alt) => { const i = document.createElement("img"); i.src = src; i.alt = alt; return i; };
  const carteChantier = (c) => {
    const article = el("article", "realisation");
    article.dataset.type = c.type;
    if (c.avant) {
      const aa = el("div", "avant-apres");
      const avant = el("div", "avant"); avant.appendChild(image(c.avant, "Avant : " + c.titre));
      const apres = el("div", "apres"); apres.appendChild(image(c.apres, "Après : " + c.titre));
      const curseur = document.createElement("input");
      Object.assign(curseur, { type: "range", min: 0, max: 100, value: 50 });
      curseur.setAttribute("aria-label", "Comparer avant et après : " + c.titre);
      aa.append(avant, apres, el("span", "poignee"), el("span", "etiquette g", "Avant"), el("span", "etiquette d", "Après"), curseur);
      article.appendChild(aa);
    } else {
      const seule = el("div", "photo-seule"); seule.appendChild(image(c.apres, c.titre));
      article.appendChild(seule);
    }
    const corps = el("div", "corps");
    const lieu = el("span", "lieu", c.commune);
    const h3 = el("h3", "", c.titre);
    h3.appendChild(el("span", "nouveau", "Nouveau"));
    corps.append(lieu, h3);
    if (c.texte) corps.appendChild(el("p", "", c.texte));
    const retirer = el("button", "lien-bouton retirer", "Retirer ce chantier (démonstration)");
    retirer.type = "button";
    retirer.addEventListener("click", () => {
      try { ecrireChantiers(lireChantiers().filter((x) => x.id !== c.id)); } catch {}
      location.reload();
    });
    corps.appendChild(retirer);
    article.appendChild(corps);
    return article;
  };
  const ajoutes = lireChantiers();
  document.querySelectorAll("[data-ajouts]").forEach((grille) => {
    ajoutes.slice().reverse().forEach((c) => grille.prepend(carteChantier(c)));
    const max = Number(grille.dataset.max);
    if (max) [...grille.children].slice(max).forEach((e) => e.remove());
  });
  if (ajoutes.length && location.hash === "#ajoute") {
    const premier = document.querySelector("[data-ajouts] .realisation");
    if (premier) premier.scrollIntoView({ block: "center" });
  }

  // Avant / après : le curseur découvre la photo « après »
  document.querySelectorAll(".avant-apres input[type=range]").forEach((r) => {
    const maj = () => r.parentElement.style.setProperty("--pos", r.value + "%");
    r.addEventListener("input", maj);
    maj();
  });

  // Réalisations : filtre par type de travaux
  const filtres = document.querySelectorAll(".filtre");
  filtres.forEach((f) => f.addEventListener("click", () => {
    filtres.forEach((x) => x.setAttribute("aria-pressed", String(x === f)));
    const type = f.dataset.type;
    document.querySelectorAll(".realisation[data-type]").forEach((a) => { a.hidden = type !== "tout" && a.dataset.type !== type; });
  }));
  // Depuis la page d'un service (?type=…), la galerie s'ouvre filtrée sur ce service
  const typeDemande = new URLSearchParams(location.search).get("type");
  if (typeDemande) {
    const f = [...filtres].find((x) => x.dataset.type === typeDemande);
    if (f) f.click();
  }

  // Formulaire de devis : type de travaux présélectionné depuis la page d'un service (?travaux=…)
  const travaux = new URLSearchParams(location.search).get("travaux");
  if (travaux) {
    const c = document.querySelector(`input[name=travaux][value="${CSS.escape(travaux)}"]`);
    if (c) c.checked = true;
  }

  // Commune : les communes de la zone proposées à la frappe (sans tenir compte des accents), une autre commune reste possible
  document.querySelectorAll("input[data-communes]").forEach((champ) => {
    const liste = document.getElementById(champ.getAttribute("aria-controls"));
    const communes = JSON.parse(champ.dataset.communes);
    const simple = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    let actif = -1;
    const fermer = () => { liste.hidden = true; champ.setAttribute("aria-expanded", "false"); champ.removeAttribute("aria-activedescendant"); actif = -1; };
    const choisir = (c) => {
      champ.value = c;
      fermer();
      const bloc = champ.closest(".champ");
      bloc.classList.remove("invalide");
      bloc.querySelector(".erreur").textContent = "";
    };
    const montrer = () => {
      const q = simple(champ.value.trim());
      const trouvees = communes.filter((c) => simple(c).includes(q));
      liste.innerHTML = "";
      trouvees.forEach((c, i) => {
        const li = document.createElement("li");
        li.id = "commune-" + i;
        li.setAttribute("role", "option");
        li.textContent = c;
        li.addEventListener("mousedown", (e) => { e.preventDefault(); choisir(c); });
        liste.appendChild(li);
      });
      liste.hidden = !trouvees.length || (trouvees.length === 1 && trouvees[0] === champ.value);
      champ.setAttribute("aria-expanded", String(!liste.hidden));
      actif = -1;
    };
    const surligner = (i) => {
      const options = [...liste.children];
      actif = i;
      options.forEach((li, k) => li.setAttribute("aria-selected", String(k === actif)));
      champ.setAttribute("aria-activedescendant", options[actif].id);
      options[actif].scrollIntoView({ block: "nearest" });
    };
    champ.addEventListener("input", montrer);
    champ.addEventListener("focus", montrer);
    champ.addEventListener("blur", fermer);
    champ.addEventListener("keydown", (e) => {
      if (liste.hidden) return;
      const n = liste.children.length;
      if (e.key === "ArrowDown") { e.preventDefault(); surligner((actif + 1) % n); }
      else if (e.key === "ArrowUp") { e.preventDefault(); surligner(actif <= 0 ? n - 1 : actif - 1); }
      else if (e.key === "Enter" && actif >= 0) { e.preventDefault(); choisir(liste.children[actif].textContent); }
      else if (e.key === "Escape") fermer();
    });
  });

  // Photos du terrain : chaque ajout s'ajoute aux précédentes (5 au plus), chaque photo peut être retirée
  document.querySelectorAll("input[type=file][data-apercu]").forEach((champ) => {
    const MAX = 5;
    const zone = document.getElementById(champ.dataset.apercu);
    const info = champ.closest(".champ").querySelector(".erreur");
    const libelle = champ.closest(".depot").querySelector("strong");
    let photos = [];
    const afficher = () => {
      // Le champ garde toutes les photos retenues : c'est lui qui part avec le formulaire
      try { const dt = new DataTransfer(); photos.forEach((f) => dt.items.add(f)); champ.files = dt.files; } catch {}
      zone.innerHTML = "";
      photos.forEach((f, i) => {
        const vignette = document.createElement("div");
        vignette.className = "apercu";
        const img = document.createElement("img");
        img.src = URL.createObjectURL(f);
        img.alt = "Aperçu : " + f.name;
        const retirer = document.createElement("button");
        retirer.type = "button";
        retirer.textContent = "×";
        retirer.setAttribute("aria-label", "Retirer la photo " + f.name);
        retirer.addEventListener("click", () => { photos.splice(i, 1); if (info) info.textContent = ""; afficher(); });
        vignette.append(img, retirer);
        zone.appendChild(vignette);
      });
      libelle.textContent = photos.length ? `Ajouter d'autres photos (${photos.length} sur ${MAX})` : "Ajouter des photos";
    };
    champ.addEventListener("change", () => {
      const nouvelles = [...champ.files].filter((f) => f.type.startsWith("image/") && !photos.some((p) => p.name === f.name && p.size === f.size));
      const place = MAX - photos.length;
      photos = photos.concat(nouvelles.slice(0, place));
      if (info) info.textContent = nouvelles.length > place ? `${MAX} photos au plus : les suivantes n'ont pas été ajoutées.` : "";
      afficher();
    });
  });

  // Formulaires : validation côté navigateur, message d'erreur par champ, piège à robots
  document.querySelectorAll("form[data-formulaire]").forEach((form) => {
    form.setAttribute("novalidate", "");
    const messages = {
      valueMissing: "Ce champ est obligatoire.",
      typeMismatch: "Le format n'est pas valide.",
      patternMismatch: "Le format n'est pas valide.",
    };
    const verifier = (champ) => {
      const bloc = champ.closest(".champ");
      if (!bloc) return true;
      const erreur = bloc.querySelector(".erreur");
      const cle = Object.keys(messages).find((k) => champ.validity[k]);
      bloc.classList.toggle("invalide", !!cle);
      if (erreur) erreur.textContent = cle ? messages[cle] : "";
      return !cle;
    };
    form.querySelectorAll("input:not([type=file]), select, textarea").forEach((c) => c.addEventListener("blur", () => verifier(c)));
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (form.querySelector(".pot-de-miel input").value) return;
      const champs = [...form.querySelectorAll("input[type=text], input[type=email], input[type=tel], select, textarea")].filter((c) => c.closest(".champ"));
      const valides = champs.map(verifier).every(Boolean);
      const groupe = form.querySelector("[data-requis-groupe]");
      const groupeOk = !groupe || !!groupe.querySelector("input:checked");
      if (groupe) groupe.parentElement.querySelector(".erreur").textContent = groupeOk ? "" : "Choisissez au moins un type de travaux.";
      const accord = form.querySelector("[name=accord]");
      const accordErr = form.querySelector(".erreur-accord");
      if (accordErr) accordErr.textContent = accord.checked ? "" : "Votre accord est nécessaire pour traiter la demande.";
      if (!valides || !groupeOk || !accord.checked) {
        const premier = form.querySelector(".invalide input, .invalide select, .invalide textarea") || (groupeOk ? accord : groupe.querySelector("input"));
        if (premier) premier.focus();
        return;
      }
      // Démonstration : aucun envoi. En production, la demande et ses photos partent par e-mail à l'entreprise.
      form.style.display = "none";
      const succes = form.parentElement.querySelector(".succes");
      if (succes) { succes.style.display = "block"; succes.focus(); }
    });
  });

  // Écran « Ajouter un chantier » : photos réduites dans le navigateur, puis le chantier passe en tête de la galerie
  const reduire = (fichier) => new Promise((ok, ko) => {
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(1, 1000 / img.width);
      const toile = document.createElement("canvas");
      toile.width = Math.round(img.width * echelle);
      toile.height = Math.round(img.height * echelle);
      toile.getContext("2d").drawImage(img, 0, 0, toile.width, toile.height);
      URL.revokeObjectURL(img.src);
      ok(toile.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => ko(new Error("image illisible"));
    img.src = URL.createObjectURL(fichier);
  });
  document.querySelectorAll("form[data-chantier]").forEach((form) => {
    form.setAttribute("novalidate", "");
    const etat = form.querySelector("[data-etat]");
    const photos = {}; // id du champ → { fichier } ou { exemple: adresse du dessin }
    const montrerPhoto = (champ, src) => {
      const depot = champ.closest(".depot-photo");
      const img = depot.querySelector("img");
      img.src = src; img.hidden = false;
      depot.querySelector(".vide").hidden = true;
      depot.classList.add("rempli");
      const bloc = champ.closest(".champ");
      bloc.classList.remove("invalide");
      bloc.querySelector(".erreur").textContent = "";
    };
    form.querySelectorAll("input[data-photo-chantier]").forEach((champ) => champ.addEventListener("change", () => {
      const f = champ.files[0];
      if (!f || !f.type.startsWith("image/")) return;
      photos[champ.id] = { fichier: f };
      montrerPhoto(champ, URL.createObjectURL(f));
    }));
    form.querySelector("[data-exemple]").addEventListener("click", () => {
      [["photo-avant", form.dataset.exempleAvant], ["photo-apres", form.dataset.exempleApres]].forEach(([id, src]) => {
        photos[id] = { exemple: src };
        montrerPhoto(form.querySelector("#" + id), src);
      });
      const remplir = (sel, v) => { const c = form.querySelector(sel); if (!c.value) c.value = v; };
      remplir("#type", "clotures-portails");
      remplir("#commune", "Chevaigné");
      remplir("#titre", "Clôture en bois et portail");
      remplir("#texte", "Clôture en pin traité sur 25 m, portail battant assorti.");
    });
    const verifier = (champ) => {
      const bloc = champ.closest(".champ");
      const vide = !champ.value.trim();
      bloc.classList.toggle("invalide", vide);
      bloc.querySelector(".erreur").textContent = vide ? "Ce champ est obligatoire." : "";
      return !vide;
    };
    form.querySelectorAll("[required]").forEach((c) => c.addEventListener("blur", () => verifier(c)));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const champsOk = [...form.querySelectorAll("[required]")].map(verifier).every(Boolean);
      const apres = form.querySelector("#photo-apres");
      const photoOk = !!photos["photo-apres"];
      if (!photoOk) {
        apres.closest(".champ").classList.add("invalide");
        apres.closest(".champ").querySelector(".erreur").textContent = "Ajoutez au moins la photo « après ».";
      }
      if (!champsOk || !photoOk) {
        const premier = form.querySelector(".invalide input, .invalide select, .invalide textarea");
        if (premier) premier.focus();
        return;
      }
      const bouton = form.querySelector("button[type=submit]");
      bouton.disabled = true;
      etat.textContent = "Préparation des photos…";
      try {
        const src = async (id) => (photos[id] ? photos[id].exemple || (await reduire(photos[id].fichier)) : null);
        const chantier = {
          id: Date.now(),
          type: form.querySelector("#type").value,
          commune: form.querySelector("#commune").value.trim(),
          titre: form.querySelector("#titre").value.trim(),
          texte: form.querySelector("#texte").value.trim(),
          avant: await src("photo-avant"),
          apres: await src("photo-apres"),
        };
        ecrireChantiers([chantier, ...lireChantiers()]);
        location.href = "realisations.html#ajoute";
      } catch (err) {
        bouton.disabled = false;
        etat.textContent = err && err.name === "QuotaExceededError"
          ? "La mémoire de ce navigateur est pleine : retirez un chantier ajouté, puis réessayez."
          : "Ce navigateur n'a pas pu garder le chantier (navigation privée ?). Sur le vrai site, il est enregistré en ligne.";
      }
    });
  });
  // Liste des chantiers déjà ajoutés, à côté du formulaire
  const mesAjouts = document.querySelector("[data-mes-ajouts]");
  if (mesAjouts && ajoutes.length) {
    mesAjouts.hidden = false;
    const ul = mesAjouts.querySelector("ul");
    ajoutes.forEach((c) => {
      const li = el("li");
      const lien = el("a", "", c.titre + " · " + c.commune);
      lien.href = "realisations.html#ajoute";
      const retirer = el("button", "lien-bouton petit", "Retirer");
      retirer.type = "button";
      retirer.addEventListener("click", () => { try { ecrireChantiers(lireChantiers().filter((x) => x.id !== c.id)); } catch {} location.reload(); });
      li.append(lien, retirer);
      ul.appendChild(li);
    });
  }

  document.querySelectorAll("[data-annee]").forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
