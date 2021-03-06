/* eslint max-len: ["error", { "code": 100 }]*/

let version = '1.08';
let cacheName = 'restaurant_reviews-' + version;

let allCaches = ['/', '/index.html', '/restaurant.html', '/js/index-min.js', '/js/restaurant-min.js', '/css/responsive.css', '/css/styles.css', '/img'];

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function (error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}
/* installing SW */
self.addEventListener('install', function (event) {
  console.log('[ServiceWorker] Install');
  event.waitUntil(caches.open(cacheName).then(function (cache) {
    console.log('[ServiceWorker] Caching');
    return cache.addAll(allCaches);
  }));
});

self.addEventListener('fetch', function (event) {
  event.respondWith(caches.match(event.request).then(function (response) {
    // Cache hit - return response
    if (response) {
      return response;
    }

    // IMPORTANT: Clone the request. A request is a stream and
    // can only be consumed once. Since we are consuming this
    // once by cache and once by the browser for fetch, we need
    // to clone the response.
    let fetchRequest = event.request.clone();

    return fetch(fetchRequest).then(function (response) {
      // Check if we received a valid response
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }

      // IMPORTANT: Clone the response. A response is a stream
      // and because we want the browser to consume the response
      // as well as the cache consuming the response, we need
      // to clone it so we have two streams.
      let responseToCache = response.clone();

      caches.open(cacheName).then(function (cache) {
        cache.put(event.request, responseToCache);
      });

      return response;
    });
  }));
});

/* remove the old one */
self.addEventListener('activate', function (event) {
  let cacheWhitelist = [cacheName];

  event.waitUntil(caches.keys().then(function (keyList) {
    return Promise.all(keyList.map(function (key) {
      if (cacheWhitelist.indexOf(key) === -1) {
        return caches.delete(key);
      }
    }));
  }));
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN3LmpzIl0sIm5hbWVzIjpbInZlcnNpb24iLCJjYWNoZU5hbWUiLCJhbGxDYWNoZXMiLCJuYXZpZ2F0b3IiLCJzZXJ2aWNlV29ya2VyIiwicmVnaXN0ZXIiLCJzY29wZSIsInRoZW4iLCJyZWciLCJjb25zb2xlIiwibG9nIiwiY2F0Y2giLCJlcnJvciIsInNlbGYiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJ3YWl0VW50aWwiLCJjYWNoZXMiLCJvcGVuIiwiY2FjaGUiLCJhZGRBbGwiLCJyZXNwb25kV2l0aCIsIm1hdGNoIiwicmVxdWVzdCIsInJlc3BvbnNlIiwiZmV0Y2hSZXF1ZXN0IiwiY2xvbmUiLCJmZXRjaCIsInN0YXR1cyIsInR5cGUiLCJyZXNwb25zZVRvQ2FjaGUiLCJwdXQiLCJjYWNoZVdoaXRlbGlzdCIsImtleXMiLCJrZXlMaXN0IiwiUHJvbWlzZSIsImFsbCIsIm1hcCIsImtleSIsImluZGV4T2YiLCJkZWxldGUiXSwibWFwcGluZ3MiOiJBQUFBOztBQUVBLElBQUlBLFVBQVUsTUFBZDtBQUNBLElBQUlDLFlBQVksd0JBQXdCRCxPQUF4Qzs7QUFHQSxJQUFJRSxZQUFZLENBQ2QsR0FEYyxFQUVkLGFBRmMsRUFHZCxrQkFIYyxFQUlkLGtCQUpjLEVBS2QsdUJBTGMsRUFNZCxxQkFOYyxFQU9kLGlCQVBjLEVBUWQsTUFSYyxDQUFoQjs7QUFXQSxJQUFJLG1CQUFtQkMsU0FBdkIsRUFBa0M7QUFDaENBLFlBQVVDLGFBQVYsQ0FBd0JDLFFBQXhCLENBQWlDLFFBQWpDLEVBQTJDLEVBQUNDLE9BQU8sR0FBUixFQUEzQyxFQUNDQyxJQURELENBQ00sVUFBU0MsR0FBVCxFQUFjO0FBQ2xCO0FBQ0FDLFlBQVFDLEdBQVIsQ0FBWSxzQ0FBc0NGLElBQUlGLEtBQXREO0FBQ0QsR0FKRCxFQUlHSyxLQUpILENBSVMsVUFBU0MsS0FBVCxFQUFnQjtBQUN2QjtBQUNBSCxZQUFRQyxHQUFSLENBQVksOEJBQThCRSxLQUExQztBQUNELEdBUEQ7QUFRRDtBQUNEO0FBQ0FDLEtBQUtDLGdCQUFMLENBQXNCLFNBQXRCLEVBQWlDLFVBQVNDLEtBQVQsRUFBZ0I7QUFDL0NOLFVBQVFDLEdBQVIsQ0FBWSx5QkFBWjtBQUNBSyxRQUFNQyxTQUFOLENBQ0VDLE9BQU9DLElBQVAsQ0FBWWpCLFNBQVosRUFBdUJNLElBQXZCLENBQTRCLFVBQVNZLEtBQVQsRUFBZ0I7QUFDMUNWLFlBQVFDLEdBQVIsQ0FBWSx5QkFBWjtBQUNBLFdBQU9TLE1BQU1DLE1BQU4sQ0FBYWxCLFNBQWIsQ0FBUDtBQUNELEdBSEQsQ0FERjtBQU1ELENBUkQ7O0FBV0FXLEtBQUtDLGdCQUFMLENBQXNCLE9BQXRCLEVBQStCLFVBQVNDLEtBQVQsRUFBZ0I7QUFDN0NBLFFBQU1NLFdBQU4sQ0FDRUosT0FBT0ssS0FBUCxDQUFhUCxNQUFNUSxPQUFuQixFQUNHaEIsSUFESCxDQUNRLFVBQVNpQixRQUFULEVBQW1CO0FBQ3ZCO0FBQ0EsUUFBSUEsUUFBSixFQUFjO0FBQ1osYUFBT0EsUUFBUDtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBSUMsZUFBZVYsTUFBTVEsT0FBTixDQUFjRyxLQUFkLEVBQW5COztBQUVBLFdBQU9DLE1BQU1GLFlBQU4sRUFBb0JsQixJQUFwQixDQUNMLFVBQVNpQixRQUFULEVBQW1CO0FBQ2pCO0FBQ0EsVUFBSSxDQUFDQSxRQUFELElBQWFBLFNBQVNJLE1BQVQsS0FBb0IsR0FBakMsSUFBd0NKLFNBQVNLLElBQVQsS0FBa0IsT0FBOUQsRUFBdUU7QUFDckUsZUFBT0wsUUFBUDtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBSU0sa0JBQWtCTixTQUFTRSxLQUFULEVBQXRCOztBQUVBVCxhQUFPQyxJQUFQLENBQVlqQixTQUFaLEVBQ0dNLElBREgsQ0FDUSxVQUFTWSxLQUFULEVBQWdCO0FBQ3BCQSxjQUFNWSxHQUFOLENBQVVoQixNQUFNUSxPQUFoQixFQUF5Qk8sZUFBekI7QUFDRCxPQUhIOztBQUtBLGFBQU9OLFFBQVA7QUFDRCxLQW5CSSxDQUFQO0FBcUJELEdBbENILENBREY7QUFxQ0QsQ0F0Q0Q7O0FBeUNBO0FBQ0FYLEtBQUtDLGdCQUFMLENBQXNCLFVBQXRCLEVBQWtDLFVBQVNDLEtBQVQsRUFBZ0I7QUFDaEQsTUFBSWlCLGlCQUFpQixDQUFDL0IsU0FBRCxDQUFyQjs7QUFFQWMsUUFBTUMsU0FBTixDQUNFQyxPQUFPZ0IsSUFBUCxHQUFjMUIsSUFBZCxDQUFtQixVQUFTMkIsT0FBVCxFQUFrQjtBQUNuQyxXQUFPQyxRQUFRQyxHQUFSLENBQVlGLFFBQVFHLEdBQVIsQ0FBWSxVQUFTQyxHQUFULEVBQWM7QUFDM0MsVUFBSU4sZUFBZU8sT0FBZixDQUF1QkQsR0FBdkIsTUFBZ0MsQ0FBQyxDQUFyQyxFQUF3QztBQUN0QyxlQUFPckIsT0FBT3VCLE1BQVAsQ0FBY0YsR0FBZCxDQUFQO0FBQ0Q7QUFDRixLQUprQixDQUFaLENBQVA7QUFLRCxHQU5ELENBREY7QUFTRCxDQVpEIiwiZmlsZSI6InN3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IG1heC1sZW46IFtcImVycm9yXCIsIHsgXCJjb2RlXCI6IDEwMCB9XSovXG5cbmxldCB2ZXJzaW9uID0gJzEuMDgnO1xubGV0IGNhY2hlTmFtZSA9ICdyZXN0YXVyYW50X3Jldmlld3MtJyArIHZlcnNpb247XG5cblxubGV0IGFsbENhY2hlcyA9IFtcbiAgJy8nLFxuICAnL2luZGV4Lmh0bWwnLFxuICAnL3Jlc3RhdXJhbnQuaHRtbCcsXG4gICcvanMvaW5kZXgtbWluLmpzJyxcbiAgJy9qcy9yZXN0YXVyYW50LW1pbi5qcycsXG4gICcvY3NzL3Jlc3BvbnNpdmUuY3NzJyxcbiAgJy9jc3Mvc3R5bGVzLmNzcycsXG4gICcvaW1nJyxcbl07XG5cbmlmICgnc2VydmljZVdvcmtlcicgaW4gbmF2aWdhdG9yKSB7XG4gIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc3cuanMnLCB7c2NvcGU6ICcvJ30pXG4gIC50aGVuKGZ1bmN0aW9uKHJlZykge1xuICAgIC8vIHJlZ2lzdHJhdGlvbiB3b3JrZWRcbiAgICBjb25zb2xlLmxvZygnUmVnaXN0cmF0aW9uIHN1Y2NlZWRlZC4gU2NvcGUgaXMgJyArIHJlZy5zY29wZSk7XG4gIH0pLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgLy8gcmVnaXN0cmF0aW9uIGZhaWxlZFxuICAgIGNvbnNvbGUubG9nKCdSZWdpc3RyYXRpb24gZmFpbGVkIHdpdGggJyArIGVycm9yKTtcbiAgfSk7XG59XG4vKiBpbnN0YWxsaW5nIFNXICovXG5zZWxmLmFkZEV2ZW50TGlzdGVuZXIoJ2luc3RhbGwnLCBmdW5jdGlvbihldmVudCkge1xuICBjb25zb2xlLmxvZygnW1NlcnZpY2VXb3JrZXJdIEluc3RhbGwnKTtcbiAgZXZlbnQud2FpdFVudGlsKFxuICAgIGNhY2hlcy5vcGVuKGNhY2hlTmFtZSkudGhlbihmdW5jdGlvbihjYWNoZSkge1xuICAgICAgY29uc29sZS5sb2coJ1tTZXJ2aWNlV29ya2VyXSBDYWNoaW5nJyk7XG4gICAgICByZXR1cm4gY2FjaGUuYWRkQWxsKGFsbENhY2hlcyk7XG4gICAgfSlcbiAgKTtcbn0pO1xuXG5cbnNlbGYuYWRkRXZlbnRMaXN0ZW5lcignZmV0Y2gnLCBmdW5jdGlvbihldmVudCkge1xuICBldmVudC5yZXNwb25kV2l0aChcbiAgICBjYWNoZXMubWF0Y2goZXZlbnQucmVxdWVzdClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIC8vIENhY2hlIGhpdCAtIHJldHVybiByZXNwb25zZVxuICAgICAgICBpZiAocmVzcG9uc2UpIHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJTVBPUlRBTlQ6IENsb25lIHRoZSByZXF1ZXN0LiBBIHJlcXVlc3QgaXMgYSBzdHJlYW0gYW5kXG4gICAgICAgIC8vIGNhbiBvbmx5IGJlIGNvbnN1bWVkIG9uY2UuIFNpbmNlIHdlIGFyZSBjb25zdW1pbmcgdGhpc1xuICAgICAgICAvLyBvbmNlIGJ5IGNhY2hlIGFuZCBvbmNlIGJ5IHRoZSBicm93c2VyIGZvciBmZXRjaCwgd2UgbmVlZFxuICAgICAgICAvLyB0byBjbG9uZSB0aGUgcmVzcG9uc2UuXG4gICAgICAgIGxldCBmZXRjaFJlcXVlc3QgPSBldmVudC5yZXF1ZXN0LmNsb25lKCk7XG5cbiAgICAgICAgcmV0dXJuIGZldGNoKGZldGNoUmVxdWVzdCkudGhlbihcbiAgICAgICAgICBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgd2UgcmVjZWl2ZWQgYSB2YWxpZCByZXNwb25zZVxuICAgICAgICAgICAgaWYgKCFyZXNwb25zZSB8fCByZXNwb25zZS5zdGF0dXMgIT09IDIwMCB8fCByZXNwb25zZS50eXBlICE9PSAnYmFzaWMnKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gSU1QT1JUQU5UOiBDbG9uZSB0aGUgcmVzcG9uc2UuIEEgcmVzcG9uc2UgaXMgYSBzdHJlYW1cbiAgICAgICAgICAgIC8vIGFuZCBiZWNhdXNlIHdlIHdhbnQgdGhlIGJyb3dzZXIgdG8gY29uc3VtZSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgIC8vIGFzIHdlbGwgYXMgdGhlIGNhY2hlIGNvbnN1bWluZyB0aGUgcmVzcG9uc2UsIHdlIG5lZWRcbiAgICAgICAgICAgIC8vIHRvIGNsb25lIGl0IHNvIHdlIGhhdmUgdHdvIHN0cmVhbXMuXG4gICAgICAgICAgICBsZXQgcmVzcG9uc2VUb0NhY2hlID0gcmVzcG9uc2UuY2xvbmUoKTtcblxuICAgICAgICAgICAgY2FjaGVzLm9wZW4oY2FjaGVOYW1lKVxuICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihjYWNoZSkge1xuICAgICAgICAgICAgICAgIGNhY2hlLnB1dChldmVudC5yZXF1ZXN0LCByZXNwb25zZVRvQ2FjaGUpO1xuICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgKTtcbn0pO1xuXG5cbi8qIHJlbW92ZSB0aGUgb2xkIG9uZSAqL1xuc2VsZi5hZGRFdmVudExpc3RlbmVyKCdhY3RpdmF0ZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gIGxldCBjYWNoZVdoaXRlbGlzdCA9IFtjYWNoZU5hbWVdO1xuXG4gIGV2ZW50LndhaXRVbnRpbChcbiAgICBjYWNoZXMua2V5cygpLnRoZW4oZnVuY3Rpb24oa2V5TGlzdCkge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGtleUxpc3QubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgICBpZiAoY2FjaGVXaGl0ZWxpc3QuaW5kZXhPZihrZXkpID09PSAtMSkge1xuICAgICAgICAgIHJldHVybiBjYWNoZXMuZGVsZXRlKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9KVxuICApO1xufSk7XG4iXX0=
