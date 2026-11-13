/* Service Worker — Sistema de Deslocamento VTR v2.1 */
/* Ao publicar uma atualização, aumente a versão do CACHE (ex.: v2.2) */
var CACHE = "vtr-cache-v2.3";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if(url.origin !== location.origin) return;

  /* Navegação: rede primeiro (atualizações chegam logo), cache como reserva offline */
  if(e.request.mode === "navigate"){
    e.respondWith(
      fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){
        return caches.match(e.request, { ignoreSearch: true })
          .then(function(c){ return c || caches.match("./index.html"); });
      })
    );
    return;
  }

  /* Demais recursos: cache primeiro, atualização em segundo plano */
  e.respondWith(
    caches.open(CACHE).then(function(cache){
      return cache.match(e.request, { ignoreSearch: true }).then(function(cached){
        var fetchAndUpdate = fetch(e.request).then(function(resp){
          if(resp && resp.ok){ cache.put(e.request, resp.clone()); }
          return resp;
        }).catch(function(){ return cached; });
        return cached || fetchAndUpdate;
      });
    })
  );
});
