// Idioma do site: inglês por padrão; o botão de globo alterna para português e a escolha fica salva.
(function () {
  var KEY = "iconezera.site.language";
  var root = document.documentElement;

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) { /* sem armazenamento: só não lembra */ }
  }
  function apply(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang === "pt" ? "pt-BR" : "en";
    var button = document.getElementById("lang-toggle");
    if (button) {
      button.textContent = lang === "pt" ? "EN" : "PT-BR";
      button.setAttribute("aria-label", lang === "pt" ? "Switch to English" : "Mudar para português");
    }
  }

  var fromUrl = /[?&]lang=(pt|en)\b/.exec(location.search);
  apply((fromUrl && fromUrl[1]) || read() || "en");

  var toggle = document.getElementById("lang-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-lang") === "pt" ? "en" : "pt";
      save(next);
      apply(next);
    });
  }
})();
