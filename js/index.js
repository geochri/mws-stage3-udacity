/* eslint "require-jsdoc": ["error", {
    "require": {
        "FunctionDeclaration": true,
        "MethodDefinition": false,
        "ClassDeclaration": false,
        "ArrowFunctionExpression": false,
        "FunctionExpression": false
    }
}]*/
/* eslint valid-jsdoc: "error"*/
/* eslint max-len: ["error", { "code": 200 }]*/
/* eslint no-unused-vars: ["error", { "vars": "local" }]*/
/* eslint brace-style: [0,{ "allowSingleLine": true }]*/
// import idb from "idb";

/**
 * Common database helper functions.
 */
let dbpromise;
let num;
class DBHelper {
  /*
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  //  const port = '1337';
  //  const host = 'http://localhost:';


  static get DATABASE_URL() {
    /*
     * const port = 8000 // Change this to your server port
     * return `http://localhost:${port}/data/restaurants.json`;
     */
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Create restaurantDatabase
   */

  static openDatabase() {
    // if (!navigator.serviceWorker){
    //  return Promise.resolve();
    // }

    return idb.open('restaurantDb', 1, function (upgradeDb) {
      upgradeDb.createObjectStore('restaurantDb', {
        keyPath: 'id' });
      // store.createIndex('by-id','id');
    });
  }

  /**
   * Create Review Database!
   */

  static openReviewDatabase() {
    return idb.open('reviewsDb', 1, function (upgradeDb) {
      upgradeDb.createObjectStore('reviewsDb', {
        keyPath: 'id' }).createIndex('restaurant_id', 'restaurant_id');
    });
  }

  /**
   * Save data to ReviewsDatabase
   */

  static saveReviewsDatabase(data) {
    return DBHelper.openReviewDatabase().then(db => {
      if (!db) return;
      let tx = db.transaction('reviewsDb', 'readwrite');
      let store = tx.objectStore('reviewsDb');
      data.forEach(review => {
        store.put(review);
      });
      return tx.complete;
    });
  }

  /**
   * Getting data from ReviewsDatabase
   */

  static reviewsGetCached(id) {
    dbpromise = DBHelper.openReviewDatabase();
    return dbpromise.then(db => {
      if (!db) return;
      let tx = db.transaction('reviewsDb');
      let store = tx.objectStore('reviewsDb');
      return store.getAll();
    }).then(res => {
      num = res.filter(r => r.restaurant_id == parseInt(id)).length;
      //console.log(num)
      return res.filter(r => r.restaurant_id == parseInt(id));
    }).catch(error => console.log(error));
  }

  /**
   * Update the Review Database after post!
   */

  static updateReviewsDb(review) {
    return DBHelper.openReviewDatabase().then(db => {
      let tx = db.transaction('reviewsDb', 'readwrite');
      let store = tx.objectStore('reviewsDb');
      // let temp = review;
      return store.add(review);
    });
  }

  /**
   * Create Outbox database!
   */

  static openOutboxDatabase() {
    return idb.open('outbox', 1, function (upgradeDb) {
      upgradeDb.createObjectStore('outbox', {
        keyPath: 'createdAt' });
    });
  }

  /**
   * Review Saving on Outbox Database
   */

  static saveOutboxDatabase(data) {
    return DBHelper.openOutboxDatabase().then(db => {
      if (!db) return;
      let tx = db.transaction('outbox', 'readwrite');
      let store = tx.objectStore('outbox');
      //  data.forEach((review) => {
      //    store.put(review);
      //  });
      store.put(data);
      return tx.complete;
    });
  }

  /**
   *  Checking review and online status && submit - Pending action!!
   */

  static pendingForSubmitReviews(reviews) {
    if (navigator.onLine && reviews.length > 0) {
      reviews.forEach(review => {
        fetch('http://localhost:1337/reviews/', {
          method: 'POST',
          body: JSON.stringify(review)
        }).then(clearOutbox());
      });
    }
  }

  /**
   * Clearing Outbox Database!
   */

  static clearOutbox() {
    if (navigator.onLine) {
      return DBHelper.openOutboxDatabase().then(db => {
        let tx = db.transaction('outbox', 'readwrite');
        let store = tx.objectStore('outbox');
        store.clear();
        return tx.complete;
      });
    }
  }

  /**
   * Online status check && submit pending reviews!!
   */

  static processAllPendingReviews() {
    if (navigator.onLine) {
      return DBHelper.openOutboxDatabase().then(db => {
        let tx = db.transaction('outbox');
        let store = tx.objectStore('outbox');
        return store.getAll();
      }).then(response => {
        // pendingForSubmitReviews(response);
        response.forEach(function (review) {
          //const rev = {
          //  'restaurant_id': review.restaurant_id,
          //  'name': review.name,
          //  'rating': review.rating,
          //    'comments': review.comments,
          //  'createdAt': review.createdAt
          //  };

          fetch('http://localhost:1337/reviews/', {
            method: 'POST', body: JSON.stringify(review)
          }).then(result => {
            self.reviews.push(result);
            // DBHelper.updateReviewsDb(result);
            let data = {
              'restaurant_id': review.restaurant_id,
              'name': review.name,
              'rating': review.rating,
              'comments': review.comments,
              'createdAt': review.createdAt,
              'id': num + 100
            };
            DBHelper.updateReviewsDb(data);
          }).catch(er => {
            callback(er, null);
          });
        });
      });
    }
  }

  /*
  * Saving on Restaurantdatabase
  */
  static saveDatabase(data) {
    return DBHelper.openDatabase().then(function (db) {
      if (!db) return;
      let tx = db.transaction('restaurantDb', 'readwrite');
      let store = tx.objectStore('restaurantDb');
      data.forEach(function (restaurant) {
        store.put(restaurant);
      });
      return tx.complete;
    });
  }

  /*
   * Update entry on Restaurantdatabase !
   */

  static updateDb(id, val) {
    return DBHelper.openDatabase().then(db => {
      let tx = db.transaction('restaurantDb');
      let store = tx.objectStore('restaurantDb');
      return store.get(id, 'is_favorite');
    }).then(object => {
      // IDB test search output
      // console.log(object);
      object.is_favorite = val;
      DBHelper.openDatabase().then(db => {
        let tx = db.transaction('restaurantDb', 'readwrite');
        let store = tx.objectStore('restaurantDb');
        store.put(object);
        return;
      });
    });
  }

  /*
  * Getting data from DB-Restaurantdatabase
  */
  static getCachedDb() {
    dbpromise = DBHelper.openDatabase();
    return dbpromise.then(function (db) {
      if (!db) return;
      let tx = db.transaction('restaurantDb');
      let store = tx.objectStore('restaurantDb');
      return store.getAll();
    });
  }

  /*
   * stage2
   */
  static fromApi() {
    return fetch(DBHelper.DATABASE_URL).then(function (response) {
      return response.json();
    }).then(restaurants => {
      DBHelper.saveDatabase(restaurants);
      return restaurants;
    });
  }

  /**
   * Fetch all restaurants.
   */

  static fetchRestaurants(callback) {
    /** stage1
    *let xhr = new XMLHttpRequest();
    *xhr.open('GET', DBHelper.DATABASE_URL);
    *xhr.onload = () => {
    *  if (xhr.status === 200) { // Got a success response from server!
    *    const json = JSON.parse(xhr.responseText);
    *    const restaurants = json.restaurants;
    *    callback(null, restaurants);
    *  } else { // Oops!. Got an error from server.
    *    const error = (`Request failed. Returned status of ${xhr.status}`);
    *    callback(error, null);
    *  }
    *};
    *xhr.send();
    **/

    /** Testing fetch from dummy server
     *fetch(DBHelper.DATABASE_URL)
     *  .then(respond => {
     *    if (!respond.ok){
     *      throw "Unable to fetch from server!";
     *    }
     *    return respond.json();
     *  })
     *  .then(restaurants => callback(null, restaurants))
     *  .catch(e => callback(e,null))
     **/

    return DBHelper.getCachedDb().then(restaurants => {
      if (restaurants.length) {
        return Promise.resolve(restaurants);
      } else {
        return DBHelper.fromApi();
      }
    }).then(restaurants => {
      callback(null, restaurants);
    }).catch(er => {
      callback(er, null);
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */

  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((er, restaurants) => {
      //  if (error) {
      //    callback(error, null);
      //  }
      //  else {
      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) {
        // Got the restaurant
        callback(null, restaurant);
      } else {
        // Restaurant does not exist in the database
        callback('Restaurant does not exist', null);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */

  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */

  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */

  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */

  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */

  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   *  Fetch all reviews
   */

  static fetchReview(callback) {
    return fetch('http://localhost:1337/reviews').then(function (response) {
      return response.json();
    }).then(reviews => {
      callback(null, reviews);
    }).catch(er => {
      callback(er, null);
    });
  }

  /**
   * Fetch review by restaurant id
   */
  /*
   * Without Cached !
   *
   *    static fetchReviewById(id, callback) {
   *      return fetch('http://localhost:1337/reviews/?restaurant_id='+ id)
   *        .then(function(response) {
   *          if (response.ok) {
   *            response.json()
   *            .then((json) => {
   *              callback(null, json);
   *              return
   *            }).catch((error) => {
   *              callback(error, null)
   *            });
   *          } else {
   *            callback((`Request failed. Returned status of ${response.status}`), null);
   *          }
   *        }
   *      ).catch((error) => callback(error, null));
   *    }
   */
  static fetchReviewById(id, callback) {
    return DBHelper.reviewsGetCached(id).then(reviews => {
      if (reviews.length > 1) {
        // let data = reviews.filter((r) => r.restaurant_id == self.restaurant.id);
        return Promise.resolve(reviews);
      } else {
        return fetch('http://localhost:1337/reviews/?restaurant_id=' + id).then(function (response) {
          return response.json();
        }).then(reviews => {
          DBHelper.saveReviewsDatabase(reviews);
          return reviews;
        });
      }
    }).then(reviews => {
      callback(null, reviews);
      return;
    }).catch(error => {
      callback(error, null);
    });
  }

  /**
   * Post Reviews
   */

  static postReviews(review) {
    return fetch('http://localhost:1337/reviews/', { method: 'POST', body: review }).then(function (response) {
      if (response.ok) {
        return response.json();
      } else {
        return [{}];
      }
    });
  }

  /*
   * Mark Favorite Restaurants
   */
  static markFavorite(restaurant) {
    let mark = '';
    if (self.restaurant.is_favorite === 'true') {
      mark = `http://localhost:1337/restaurants/${restaurant}/?is_favorite=true`;
      console.log(mark);
    } else if (self.restaurant.is_favorite === 'false') {
      mark = `http://localhost:1337/restaurants/${restaurant}/?is_favorite=false`;
      console.log(mark);
    }

    return fetch(mark, { method: 'PUT' }).then(function (response) {
      if (response.ok) {
        return response.json();
      } else {
        return [{}];
      }
    });
  }

  /**
   * Restaurant page URL.
   */

  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */

  static imageUrlForRestaurant(restaurant) {
    // return (`/img/${restaurant.photograph}`
    /*
            if (Modernizr.webp) {
              // supported
              return (`/dist/img/${restaurant.photograph}.webp`);
            } else {
              // not-supported
              return (`/dist/img/${restaurant.photograph}.jpg`);
            }
            */
    return `/img/${restaurant.photograph}.webp`;
  }

  /**
   * Map marker for a restaurant.
   */

  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP });
    return marker;
  }
}
/* eslint max-len: ["error", { "code": 200 }]*/
/* eslint no-unused-vars: ["error", { "vars": "local" }]*/

let restaurants;
let neighborhoods;
let cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error != null) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */

fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    option.setAttribute('aria-label', neighborhood);
    option.setAttribute('role', 'option');
    select.append(option);
    // select[0].setAttribute('label',select[0].innerHTML);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */

fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */

fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    option.setAttribute('aria-label', cuisine);
    option.setAttribute('role', 'option');
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */

window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });

  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */

updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;

  // cSelect[0].setAttribute('label',cSelect[0].innerHTML);
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */

resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */

fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */

createRestaurantHTML = restaurant => {
  const li = document.createElement('li');
  li.setAttribute('role', 'listitem');
  li.setAttribute('tabindex', '0');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('role', 'img');
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  // image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  /* unique alt for the image */
  image.setAttribute('aria-label', name.innerHTML + ' restaurant');
  image.setAttribute('alt', name.innerHTML + ' restaurant');

  li.append(image);
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('role', 'link');
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);
  const badge = document.createElement('span');
  if (restaurant.is_favorite === 'true') {
    badge.innerHTML += `<button tabindex="0" aria-label="Mark as favorite place" class="favorite" disabled></button>`;
  } else {
    badge.innerHTML += `<button tabindex="0" aria-label="Mark as unfavorite place" class="un_favorite" disabled></button>`;
  }
  li.append(badge);
  return li;
};

/**
 * Add markers for current restaurants to the map.
 */

addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwibWFpbi5qcyJdLCJuYW1lcyI6WyJkYnByb21pc2UiLCJudW0iLCJEQkhlbHBlciIsIkRBVEFCQVNFX1VSTCIsInBvcnQiLCJvcGVuRGF0YWJhc2UiLCJpZGIiLCJvcGVuIiwidXBncmFkZURiIiwiY3JlYXRlT2JqZWN0U3RvcmUiLCJrZXlQYXRoIiwib3BlblJldmlld0RhdGFiYXNlIiwiY3JlYXRlSW5kZXgiLCJzYXZlUmV2aWV3c0RhdGFiYXNlIiwiZGF0YSIsInRoZW4iLCJkYiIsInR4IiwidHJhbnNhY3Rpb24iLCJzdG9yZSIsIm9iamVjdFN0b3JlIiwiZm9yRWFjaCIsInJldmlldyIsInB1dCIsImNvbXBsZXRlIiwicmV2aWV3c0dldENhY2hlZCIsImlkIiwiZ2V0QWxsIiwicmVzIiwiZmlsdGVyIiwiciIsInJlc3RhdXJhbnRfaWQiLCJwYXJzZUludCIsImxlbmd0aCIsImNhdGNoIiwiZXJyb3IiLCJjb25zb2xlIiwibG9nIiwidXBkYXRlUmV2aWV3c0RiIiwiYWRkIiwib3Blbk91dGJveERhdGFiYXNlIiwic2F2ZU91dGJveERhdGFiYXNlIiwicGVuZGluZ0ZvclN1Ym1pdFJldmlld3MiLCJyZXZpZXdzIiwibmF2aWdhdG9yIiwib25MaW5lIiwiZmV0Y2giLCJtZXRob2QiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImNsZWFyT3V0Ym94IiwiY2xlYXIiLCJwcm9jZXNzQWxsUGVuZGluZ1Jldmlld3MiLCJyZXNwb25zZSIsInJlc3VsdCIsInNlbGYiLCJwdXNoIiwibmFtZSIsInJhdGluZyIsImNvbW1lbnRzIiwiY3JlYXRlZEF0IiwiZXIiLCJjYWxsYmFjayIsInNhdmVEYXRhYmFzZSIsInJlc3RhdXJhbnQiLCJ1cGRhdGVEYiIsInZhbCIsImdldCIsIm9iamVjdCIsImlzX2Zhdm9yaXRlIiwiZ2V0Q2FjaGVkRGIiLCJmcm9tQXBpIiwianNvbiIsInJlc3RhdXJhbnRzIiwiZmV0Y2hSZXN0YXVyYW50cyIsIlByb21pc2UiLCJyZXNvbHZlIiwiZmV0Y2hSZXN0YXVyYW50QnlJZCIsImZpbmQiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmUiLCJjdWlzaW5lIiwicmVzdWx0cyIsImN1aXNpbmVfdHlwZSIsImZldGNoUmVzdGF1cmFudEJ5TmVpZ2hib3Job29kIiwibmVpZ2hib3Job29kIiwiZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kIiwiZmV0Y2hOZWlnaGJvcmhvb2RzIiwibmVpZ2hib3Job29kcyIsIm1hcCIsInYiLCJpIiwidW5pcXVlTmVpZ2hib3Job29kcyIsImluZGV4T2YiLCJmZXRjaEN1aXNpbmVzIiwiY3Vpc2luZXMiLCJ1bmlxdWVDdWlzaW5lcyIsImZldGNoUmV2aWV3IiwiZmV0Y2hSZXZpZXdCeUlkIiwicG9zdFJldmlld3MiLCJvayIsIm1hcmtGYXZvcml0ZSIsIm1hcmsiLCJ1cmxGb3JSZXN0YXVyYW50IiwiaW1hZ2VVcmxGb3JSZXN0YXVyYW50IiwicGhvdG9ncmFwaCIsIm1hcE1hcmtlckZvclJlc3RhdXJhbnQiLCJtYXJrZXIiLCJnb29nbGUiLCJtYXBzIiwiTWFya2VyIiwicG9zaXRpb24iLCJsYXRsbmciLCJ0aXRsZSIsInVybCIsImFuaW1hdGlvbiIsIkFuaW1hdGlvbiIsIkRST1AiLCJtYXJrZXJzIiwiZG9jdW1lbnQiLCJhZGRFdmVudExpc3RlbmVyIiwiZmlsbE5laWdoYm9yaG9vZHNIVE1MIiwic2VsZWN0IiwiZ2V0RWxlbWVudEJ5SWQiLCJvcHRpb24iLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwidmFsdWUiLCJzZXRBdHRyaWJ1dGUiLCJhcHBlbmQiLCJmaWxsQ3Vpc2luZXNIVE1MIiwid2luZG93IiwiaW5pdE1hcCIsImxvYyIsImxhdCIsImxuZyIsIk1hcCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsInVwZGF0ZVJlc3RhdXJhbnRzIiwiY1NlbGVjdCIsIm5TZWxlY3QiLCJjSW5kZXgiLCJzZWxlY3RlZEluZGV4IiwibkluZGV4IiwicmVzZXRSZXN0YXVyYW50cyIsImZpbGxSZXN0YXVyYW50c0hUTUwiLCJ1bCIsIm0iLCJzZXRNYXAiLCJjcmVhdGVSZXN0YXVyYW50SFRNTCIsImFkZE1hcmtlcnNUb01hcCIsImxpIiwiaW1hZ2UiLCJjbGFzc05hbWUiLCJkYXRhc2V0Iiwic3JjIiwiYWRkcmVzcyIsIm1vcmUiLCJocmVmIiwiYmFkZ2UiLCJldmVudCIsImFkZExpc3RlbmVyIiwibG9jYXRpb24iXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7QUFTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7QUFHQSxJQUFJQSxTQUFKO0FBQ0EsSUFBSUMsR0FBSjtBQUNBLE1BQU1DLFFBQU4sQ0FBZTtBQUNiOzs7O0FBSUY7QUFDQTs7O0FBR0UsYUFBV0MsWUFBWCxHQUEwQjtBQUN6Qjs7OztBQUlDLFVBQU1DLE9BQU8sSUFBYixDQUx3QixDQUtMO0FBQ25CLFdBQVEsb0JBQW1CQSxJQUFLLGNBQWhDO0FBQ0Q7O0FBRUQ7Ozs7QUFJQSxTQUFPQyxZQUFQLEdBQXNCO0FBQ3BCO0FBQ0E7QUFDQTs7QUFFQSxXQUFPQyxJQUFJQyxJQUFKLENBQVMsY0FBVCxFQUF5QixDQUF6QixFQUE0QixVQUFTQyxTQUFULEVBQW9CO0FBQ3JEQSxnQkFBVUMsaUJBQVYsQ0FBNEIsY0FBNUIsRUFBNEM7QUFDMUNDLGlCQUFTLElBRGlDLEVBQTVDO0FBRUE7QUFDRCxLQUpNLENBQVA7QUFLRDs7QUFFRDs7OztBQUlDLFNBQU9DLGtCQUFQLEdBQTRCO0FBQzFCLFdBQU9MLElBQUlDLElBQUosQ0FBUyxXQUFULEVBQXNCLENBQXRCLEVBQXlCLFVBQVNDLFNBQVQsRUFBb0I7QUFDbERBLGdCQUFVQyxpQkFBVixDQUE0QixXQUE1QixFQUF5QztBQUN4Q0MsaUJBQVMsSUFEK0IsRUFBekMsRUFDaUJFLFdBRGpCLENBQzZCLGVBRDdCLEVBQzhDLGVBRDlDO0FBRUQsS0FITSxDQUFQO0FBSUQ7O0FBRUQ7Ozs7QUFJQSxTQUFPQyxtQkFBUCxDQUEyQkMsSUFBM0IsRUFB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WXJELE9BQVosQ0FBcUI0QyxVQUFELElBQWdCO0FBQ2xDO0FBQ0EsVUFBTTBDLFNBQVN6RyxTQUFTd0csc0JBQVQsQ0FBZ0N6QyxVQUFoQyxFQUE0Q1QsS0FBS2lDLEdBQWpELENBQWY7QUFDQW1CLFdBQU9DLElBQVAsQ0FBWXFELEtBQVosQ0FBa0JDLFdBQWxCLENBQThCeEQsTUFBOUIsRUFBc0MsT0FBdEMsRUFBK0MsTUFBTTtBQUNuRHdCLGFBQU9pQyxRQUFQLENBQWdCSixJQUFoQixHQUF1QnJELE9BQU9PLEdBQTlCO0FBQ0QsS0FGRDtBQUdBMUQsU0FBSzhELE9BQUwsQ0FBYTdELElBQWIsQ0FBa0JrRCxNQUFsQjtBQUNELEdBUEQ7QUFRRCxDQVREIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IFwicmVxdWlyZS1qc2RvY1wiOiBbXCJlcnJvclwiLCB7XG4gICAgXCJyZXF1aXJlXCI6IHtcbiAgICAgICAgXCJGdW5jdGlvbkRlY2xhcmF0aW9uXCI6IHRydWUsXG4gICAgICAgIFwiTWV0aG9kRGVmaW5pdGlvblwiOiBmYWxzZSxcbiAgICAgICAgXCJDbGFzc0RlY2xhcmF0aW9uXCI6IGZhbHNlLFxuICAgICAgICBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6IGZhbHNlLFxuICAgICAgICBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOiBmYWxzZVxuICAgIH1cbn1dKi9cbi8qIGVzbGludCB2YWxpZC1qc2RvYzogXCJlcnJvclwiKi9cbi8qIGVzbGludCBtYXgtbGVuOiBbXCJlcnJvclwiLCB7IFwiY29kZVwiOiAyMDAgfV0qL1xuLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiBbXCJlcnJvclwiLCB7IFwidmFyc1wiOiBcImxvY2FsXCIgfV0qL1xuLyogZXNsaW50IGJyYWNlLXN0eWxlOiBbMCx7IFwiYWxsb3dTaW5nbGVMaW5lXCI6IHRydWUgfV0qL1xuLy8gaW1wb3J0IGlkYiBmcm9tIFwiaWRiXCI7XG5cbi8qKlxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXG4gKi9cbmxldCBkYnByb21pc2U7XG5sZXQgbnVtO1xuY2xhc3MgREJIZWxwZXIge1xuICAvKlxuICAgKiBEYXRhYmFzZSBVUkwuXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cbiAgICovXG4vLyAgY29uc3QgcG9ydCA9ICcxMzM3Jztcbi8vICBjb25zdCBob3N0ID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6JztcblxuXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xuICAgLypcbiAgICAqIGNvbnN0IHBvcnQgPSA4MDAwIC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcbiAgICAqIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L2RhdGEvcmVzdGF1cmFudHMuanNvbmA7XG4gICAgKi9cbiAgICBjb25zdCBwb3J0ID0gMTMzNzsgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L3Jlc3RhdXJhbnRzYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgcmVzdGF1cmFudERhdGFiYXNlXG4gICAqL1xuXG4gIHN0YXRpYyBvcGVuRGF0YWJhc2UoKSB7XG4gICAgLy8gaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcil7XG4gICAgLy8gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAvLyB9XG5cbiAgICByZXR1cm4gaWRiLm9wZW4oJ3Jlc3RhdXJhbnREYicsIDEsIGZ1bmN0aW9uKHVwZ3JhZGVEYikge1xuICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInLCB7XG4gICAgICAgIGtleVBhdGg6ICdpZCd9KTtcbiAgICAgIC8vIHN0b3JlLmNyZWF0ZUluZGV4KCdieS1pZCcsJ2lkJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIFJldmlldyBEYXRhYmFzZSFcbiAgICovXG5cbiAgIHN0YXRpYyBvcGVuUmV2aWV3RGF0YWJhc2UoKSB7XG4gICAgIHJldHVybiBpZGIub3BlbigncmV2aWV3c0RiJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXZpZXdzRGInLCB7XG4gICAgICAgIGtleVBhdGg6ICdpZCd9KS5jcmVhdGVJbmRleCgncmVzdGF1cmFudF9pZCcsICdyZXN0YXVyYW50X2lkJyk7XG4gICAgIH0pO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFNhdmUgZGF0YSB0byBSZXZpZXdzRGF0YWJhc2VcbiAgICAqL1xuXG4gICBzdGF0aWMgc2F2ZVJldmlld3NEYXRhYmFzZShkYXRhKSB7XG4gICAgIHJldHVybiBEQkhlbHBlci5vcGVuUmV2aWV3RGF0YWJhc2UoKS50aGVuKChkYikgPT4ge1xuICAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbigncmV2aWV3c0RiJywgJ3JlYWR3cml0ZScpO1xuICAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXZpZXdzRGInKTtcbiAgICAgICBkYXRhLmZvckVhY2goKHJldmlldykgPT4ge1xuICAgICAgICAgc3RvcmUucHV0KHJldmlldyk7XG4gICAgICAgfSk7XG4gICAgICAgcmV0dXJuIHR4LmNvbXBsZXRlO1xuICAgICB9KTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBHZXR0aW5nIGRhdGEgZnJvbSBSZXZpZXdzRGF0YWJhc2VcbiAgICAqL1xuXG4gICBzdGF0aWMgcmV2aWV3c0dldENhY2hlZChpZCkge1xuICAgICBkYnByb21pc2UgPSBEQkhlbHBlci5vcGVuUmV2aWV3RGF0YWJhc2UoKTtcbiAgICAgcmV0dXJuIGRicHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbigncmV2aWV3c0RiJyk7XG4gICAgICAgbGV0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jldmlld3NEYicpO1xuICAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKTtcbiAgICAgfSkudGhlbigocmVzKSA9PiB7XG4gICAgICAgbnVtPXJlcy5maWx0ZXIoKHIpID0+IHIucmVzdGF1cmFudF9pZD09cGFyc2VJbnQoaWQpKS5sZW5ndGg7XG4gICAgICAgLy9jb25zb2xlLmxvZyhudW0pXG4gICAgICAgcmV0dXJuIHJlcy5maWx0ZXIoKHIpID0+IHIucmVzdGF1cmFudF9pZD09cGFyc2VJbnQoaWQpKTtcbiAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiBjb25zb2xlLmxvZyhlcnJvcikpO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFVwZGF0ZSB0aGUgUmV2aWV3IERhdGFiYXNlIGFmdGVyIHBvc3QhXG4gICAgKi9cblxuICAgc3RhdGljIHVwZGF0ZVJldmlld3NEYihyZXZpZXcpIHtcbiAgICAgcmV0dXJuIERCSGVscGVyLm9wZW5SZXZpZXdEYXRhYmFzZSgpLnRoZW4oKGRiKSA9PiB7XG4gICAgICAgbGV0IHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jldmlld3NEYicsICdyZWFkd3JpdGUnKTtcbiAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmV2aWV3c0RiJyk7XG4gICAgICAgLy8gbGV0IHRlbXAgPSByZXZpZXc7XG4gICAgICAgcmV0dXJuIHN0b3JlLmFkZChyZXZpZXcpO1xuICAgICB9KTtcbiAgIH1cblxuICAvKipcbiAgICogQ3JlYXRlIE91dGJveCBkYXRhYmFzZSFcbiAgICovXG5cbiAgICBzdGF0aWMgb3Blbk91dGJveERhdGFiYXNlKCkge1xuICAgICAgcmV0dXJuIGlkYi5vcGVuKCdvdXRib3gnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdvdXRib3gnLCB7XG4gICAgICAgIGtleVBhdGg6ICdjcmVhdGVkQXQnfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXZpZXcgU2F2aW5nIG9uIE91dGJveCBEYXRhYmFzZVxuICAgICAqL1xuXG4gICAgc3RhdGljIHNhdmVPdXRib3hEYXRhYmFzZShkYXRhKSB7XG4gICAgICByZXR1cm4gREJIZWxwZXIub3Blbk91dGJveERhdGFiYXNlKCkudGhlbigoZGIpID0+IHtcbiAgICAgICAgaWYgKCFkYikgcmV0dXJuO1xuICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbignb3V0Ym94JywgJ3JlYWR3cml0ZScpO1xuICAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnb3V0Ym94Jyk7XG4gICAgICAvLyAgZGF0YS5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICAgIC8vICAgIHN0b3JlLnB1dChyZXZpZXcpO1xuICAgICAgLy8gIH0pO1xuICAgICAgICBzdG9yZS5wdXQoZGF0YSk7XG4gICAgICAgIHJldHVybiB0eC5jb21wbGV0ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBDaGVja2luZyByZXZpZXcgYW5kIG9ubGluZSBzdGF0dXMgJiYgc3VibWl0IC0gUGVuZGluZyBhY3Rpb24hIVxuICAgICAqL1xuXG4gICAgc3RhdGljIHBlbmRpbmdGb3JTdWJtaXRSZXZpZXdzKHJldmlld3MpIHtcbiAgICAgIGlmIChuYXZpZ2F0b3Iub25MaW5lICYmIHJldmlld3MubGVuZ3RoPjApIHtcbiAgICAgICAgcmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICAgICAgICBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jldmlld3MvJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXZpZXcpLFxuICAgICAgICAgIH0pLnRoZW4oY2xlYXJPdXRib3goKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFyaW5nIE91dGJveCBEYXRhYmFzZSFcbiAgICAgKi9cblxuICAgIHN0YXRpYyBjbGVhck91dGJveCgpIHtcbiAgICAgIGlmIChuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICByZXR1cm4gREJIZWxwZXIub3Blbk91dGJveERhdGFiYXNlKCkudGhlbigoZGIpID0+e1xuICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbignb3V0Ym94JywgJ3JlYWR3cml0ZScpO1xuICAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnb3V0Ym94Jyk7XG4gICAgICAgIHN0b3JlLmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0eC5jb21wbGV0ZTtcbiAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogT25saW5lIHN0YXR1cyBjaGVjayAmJiBzdWJtaXQgcGVuZGluZyByZXZpZXdzISFcbiAgICAgKi9cblxuICAgIHN0YXRpYyBwcm9jZXNzQWxsUGVuZGluZ1Jldmlld3MoKSB7XG4gICAgICBpZiAobmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICByZXR1cm4gREJIZWxwZXIub3Blbk91dGJveERhdGFiYXNlKCkudGhlbigoZGIpID0+IHtcbiAgICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbignb3V0Ym94Jyk7XG4gICAgICAgICAgbGV0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ291dGJveCcpO1xuICAgICAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAvLyBwZW5kaW5nRm9yU3VibWl0UmV2aWV3cyhyZXNwb25zZSk7XG4gICAgICAgICAgcmVzcG9uc2UuZm9yRWFjaChmdW5jdGlvbihyZXZpZXcpIHtcbiAgICAgICAgICAgIC8vY29uc3QgcmV2ID0ge1xuICAgICAgICAgICAgLy8gICdyZXN0YXVyYW50X2lkJzogcmV2aWV3LnJlc3RhdXJhbnRfaWQsXG4gICAgICAgICAgICAvLyAgJ25hbWUnOiByZXZpZXcubmFtZSxcbiAgICAgICAgICAgIC8vICAncmF0aW5nJzogcmV2aWV3LnJhdGluZyxcbiAgICAgICAgICAvLyAgICAnY29tbWVudHMnOiByZXZpZXcuY29tbWVudHMsXG4gICAgICAgICAgICAvLyAgJ2NyZWF0ZWRBdCc6IHJldmlldy5jcmVhdGVkQXRcbiAgICAgICAgICAvLyAgfTtcblxuICAgICAgICAgICAgZmV0Y2goJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXZpZXdzLycsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJldmlldylcbiAgICAgICAgICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucmV2aWV3cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgLy8gREJIZWxwZXIudXBkYXRlUmV2aWV3c0RiKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICdyZXN0YXVyYW50X2lkJzogcmV2aWV3LnJlc3RhdXJhbnRfaWQsXG4gICAgICAgICAgICAgICAgICAgICduYW1lJzogcmV2aWV3Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICdyYXRpbmcnOiByZXZpZXcucmF0aW5nLFxuICAgICAgICAgICAgICAgICAgICAnY29tbWVudHMnOiByZXZpZXcuY29tbWVudHMsXG4gICAgICAgICAgICAgICAgICAgICdjcmVhdGVkQXQnOiByZXZpZXcuY3JlYXRlZEF0LFxuICAgICAgICAgICAgICAgICAgICAnaWQnOiBudW0rMTAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIERCSGVscGVyLnVwZGF0ZVJldmlld3NEYihkYXRhKTtcbiAgICAgICAgICAgICAgfSkuY2F0Y2goKGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXIsIG51bGwpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gIC8qXG4gICogU2F2aW5nIG9uIFJlc3RhdXJhbnRkYXRhYmFzZVxuICAqL1xuICBzdGF0aWMgc2F2ZURhdGFiYXNlKGRhdGEpIHtcbiAgICByZXR1cm4gREJIZWxwZXIub3BlbkRhdGFiYXNlKCkudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgaWYgKCFkYikgcmV0dXJuO1xuICAgICAgbGV0IHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnREYicsICdyZWFkd3JpdGUnKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihyZXN0YXVyYW50KSB7XG4gICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHR4LmNvbXBsZXRlO1xuICAgIH0pO1xuICB9XG5cblxuICAvKlxuICAgKiBVcGRhdGUgZW50cnkgb24gUmVzdGF1cmFudGRhdGFiYXNlICFcbiAgICovXG5cbiAgc3RhdGljIHVwZGF0ZURiKGlkLCB2YWwpIHtcbiAgICByZXR1cm4gREJIZWxwZXIub3BlbkRhdGFiYXNlKCkudGhlbigoZGIpID0+IHtcbiAgICAgIGxldCB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIHJldHVybiBzdG9yZS5nZXQoaWQsICdpc19mYXZvcml0ZScpO1xuICAgIH0pLnRoZW4oKG9iamVjdCkgPT4ge1xuICAgICAgIC8vIElEQiB0ZXN0IHNlYXJjaCBvdXRwdXRcbiAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdCk7XG4gICAgICBvYmplY3QuaXNfZmF2b3JpdGUgPSB2YWw7XG4gICAgICBEQkhlbHBlci5vcGVuRGF0YWJhc2UoKS50aGVuKChkYikgPT4ge1xuICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERiJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudERiJyk7XG4gICAgICAgIHN0b3JlLnB1dChvYmplY3QpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gICogR2V0dGluZyBkYXRhIGZyb20gREItUmVzdGF1cmFudGRhdGFiYXNlXG4gICovXG4gIHN0YXRpYyBnZXRDYWNoZWREYigpIHtcbiAgICBkYnByb21pc2UgPSBEQkhlbHBlci5vcGVuRGF0YWJhc2UoKTtcbiAgICByZXR1cm4gZGJwcm9taXNlLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgIGxldCB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gICAqIHN0YWdlMlxuICAgKi9cbiAgc3RhdGljIGZyb21BcGkoKSB7XG4gICAgcmV0dXJuIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICB9KS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgICBEQkhlbHBlci5zYXZlRGF0YWJhc2UocmVzdGF1cmFudHMpO1xuICAgICAgICByZXR1cm4gcmVzdGF1cmFudHM7XG4gICAgICB9KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cbiAgICovXG5cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudHMoY2FsbGJhY2spIHtcbiAgICAvKiogc3RhZ2UxXG4gICAgKmxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAqeGhyLm9wZW4oJ0dFVCcsIERCSGVscGVyLkRBVEFCQVNFX1VSTCk7XG4gICAgKnhoci5vbmxvYWQgPSAoKSA9PiB7XG4gICAgKiAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkgeyAvLyBHb3QgYSBzdWNjZXNzIHJlc3BvbnNlIGZyb20gc2VydmVyIVxuICAgICogICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgKiAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb24ucmVzdGF1cmFudHM7XG4gICAgKiAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XG4gICAgKiAgfSBlbHNlIHsgLy8gT29wcyEuIEdvdCBhbiBlcnJvciBmcm9tIHNlcnZlci5cbiAgICAqICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7eGhyLnN0YXR1c31gKTtcbiAgICAqICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAqICB9XG4gICAgKn07XG4gICAgKnhoci5zZW5kKCk7XG4gICAgKiovXG5cbiAgIC8qKiBUZXN0aW5nIGZldGNoIGZyb20gZHVtbXkgc2VydmVyXG4gICAgKmZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcbiAgICAqICAudGhlbihyZXNwb25kID0+IHtcbiAgICAqICAgIGlmICghcmVzcG9uZC5vayl7XG4gICAgKiAgICAgIHRocm93IFwiVW5hYmxlIHRvIGZldGNoIGZyb20gc2VydmVyIVwiO1xuICAgICogICAgfVxuICAgICogICAgcmV0dXJuIHJlc3BvbmQuanNvbigpO1xuICAgICogIH0pXG4gICAgKiAgLnRoZW4ocmVzdGF1cmFudHMgPT4gY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpKVxuICAgICogIC5jYXRjaChlID0+IGNhbGxiYWNrKGUsbnVsbCkpXG4gICAgKiovXG5cbiAgICByZXR1cm4gREJIZWxwZXIuZ2V0Q2FjaGVkRGIoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgaWYgKHJlc3RhdXJhbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3RhdXJhbnRzKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gREJIZWxwZXIuZnJvbUFwaSgpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVyKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGVyLCBudWxsKTtcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIC8qKlxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxuICAgKi9cblxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcbiAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXIsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgLy8gIGlmIChlcnJvcikge1xuICAgIC8vICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAvLyAgfVxuICAgIC8vICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLmZpbmQoKHIpID0+IHIuaWQgPT0gaWQpO1xuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcbiAgICAgICAgICBjYWxsYmFjaygnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG5cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcigocikgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cblxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgIH1cbiBlbHNlIHtcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcigocikgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG5cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgfVxuIGVsc2Uge1xuICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzO1xuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcigocikgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKChyKSA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cblxuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgfVxuIGVsc2Uge1xuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKTtcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSk7XG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZUN1aXNpbmVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiAgRmV0Y2ggYWxsIHJldmlld3NcbiAgICovXG5cbiAgIHN0YXRpYyBmZXRjaFJldmlldyhjYWxsYmFjaykge1xuICAgIHJldHVybiBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jldmlld3MnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIH0pLnRoZW4oKHJldmlld3MpID0+IHtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXZpZXdzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcikgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKGVyLCBudWxsKTtcbiAgICAgICAgfSk7XG4gICB9XG5cbiAgIC8qKlxuICAgICogRmV0Y2ggcmV2aWV3IGJ5IHJlc3RhdXJhbnQgaWRcbiAgICAqL1xuLypcbiAqIFdpdGhvdXQgQ2FjaGVkICFcbiAqXG4gKiAgICBzdGF0aWMgZmV0Y2hSZXZpZXdCeUlkKGlkLCBjYWxsYmFjaykge1xuICogICAgICByZXR1cm4gZmV0Y2goJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXZpZXdzLz9yZXN0YXVyYW50X2lkPScrIGlkKVxuICogICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gKiAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAqICAgICAgICAgICAgcmVzcG9uc2UuanNvbigpXG4gKiAgICAgICAgICAgIC50aGVuKChqc29uKSA9PiB7XG4gKiAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwganNvbik7XG4gKiAgICAgICAgICAgICAgcmV0dXJuXG4gKiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICogICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKVxuICogICAgICAgICAgICB9KTtcbiAqICAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgIGNhbGxiYWNrKChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKSwgbnVsbCk7XG4gKiAgICAgICAgICB9XG4gKiAgICAgICAgfVxuICogICAgICApLmNhdGNoKChlcnJvcikgPT4gY2FsbGJhY2soZXJyb3IsIG51bGwpKTtcbiAqICAgIH1cbiAqL1xuICAgIHN0YXRpYyBmZXRjaFJldmlld0J5SWQoaWQsIGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gREJIZWxwZXIucmV2aWV3c0dldENhY2hlZChpZCkudGhlbigocmV2aWV3cykgPT4ge1xuICAgICAgICBpZiAocmV2aWV3cy5sZW5ndGg+MSkge1xuICAgICAgICAgIC8vIGxldCBkYXRhID0gcmV2aWV3cy5maWx0ZXIoKHIpID0+IHIucmVzdGF1cmFudF9pZCA9PSBzZWxmLnJlc3RhdXJhbnQuaWQpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmV2aWV3cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZldGNoKCdodHRwOi8vbG9jYWxob3N0OjEzMzcvcmV2aWV3cy8/cmVzdGF1cmFudF9pZD0nKyBpZClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICB9KS50aGVuKChyZXZpZXdzKSA9PiB7XG4gICAgICAgICAgICAgIERCSGVscGVyLnNhdmVSZXZpZXdzRGF0YWJhc2UocmV2aWV3cyk7XG4gICAgICAgICAgICAgIHJldHVybiByZXZpZXdzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKHJldmlld3MpID0+IHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV2aWV3cyk7XG4gICAgICAgIHJldHVyblxuICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgIH0pO1xuICB9XG5cblxuICAvKipcbiAgICogUG9zdCBSZXZpZXdzXG4gICAqL1xuXG4gICBzdGF0aWMgcG9zdFJldmlld3MocmV2aWV3KSB7XG4gICAgIHJldHVybiBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jldmlld3MvJywge21ldGhvZDogJ1BPU1QnLCBib2R5OiByZXZpZXd9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gW3t9XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICB9XG5cbiAgIC8qXG4gICAgKiBNYXJrIEZhdm9yaXRlIFJlc3RhdXJhbnRzXG4gICAgKi9cbiAgICBzdGF0aWMgbWFya0Zhdm9yaXRlKHJlc3RhdXJhbnQpIHtcbiAgICAgIGxldCBtYXJrID0gJyc7XG4gICAgICBpZiAoc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlPT09J3RydWUnKSB7XG4gICAgICAgIG1hcmsgPSBgaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jlc3RhdXJhbnRzLyR7cmVzdGF1cmFudH0vP2lzX2Zhdm9yaXRlPXRydWVgO1xuICAgICAgICBjb25zb2xlLmxvZyhtYXJrKTtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlPT09J2ZhbHNlJykge1xuICAgICAgICBtYXJrID0gYGh0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXN0YXVyYW50cy8ke3Jlc3RhdXJhbnR9Lz9pc19mYXZvcml0ZT1mYWxzZWA7XG4gICAgICAgIGNvbnNvbGUubG9nKG1hcmspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmV0Y2gobWFyaywge21ldGhvZDogJ1BVVCd9KVxuICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgcmV0dXJuIFt7fV07XG4gICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXG4gICAqL1xuXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXG4gICAqL1xuXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIC8vIHJldHVybiAoYC9pbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGh9YFxuLypcbiAgICAgICAgaWYgKE1vZGVybml6ci53ZWJwKSB7XG4gICAgICAgICAgLy8gc3VwcG9ydGVkXG4gICAgICAgICAgcmV0dXJuIChgL2Rpc3QvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofS53ZWJwYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gbm90LXN1cHBvcnRlZFxuICAgICAgICAgIHJldHVybiAoYC9kaXN0L2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH0uanBnYCk7XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIChgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH0ud2VicGApO1xuICAgIH1cblxuXG4gIC8qKlxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXG4gICAqL1xuXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgcG9zaXRpb246IHJlc3RhdXJhbnQubGF0bG5nLFxuICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcbiAgICAgIG1hcDogbWFwLFxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cbiAgICApO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cbn1cbiIsIi8qIGVzbGludCBtYXgtbGVuOiBbXCJlcnJvclwiLCB7IFwiY29kZVwiOiAyMDAgfV0qL1xuLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiBbXCJlcnJvclwiLCB7IFwidmFyc1wiOiBcImxvY2FsXCIgfV0qL1xuXG5sZXQgcmVzdGF1cmFudHM7XG5sZXQgbmVpZ2hib3Job29kcztcbmxldCBjdWlzaW5lcztcbnZhciBtYXA7XG52YXIgbWFya2VycyA9IFtdO1xuXG4vKipcbiAqIEZldGNoIG5laWdoYm9yaG9vZHMgYW5kIGN1aXNpbmVzIGFzIHNvb24gYXMgdGhlIHBhZ2UgaXMgbG9hZGVkLlxuICovXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xuICBmZXRjaE5laWdoYm9yaG9vZHMoKTtcbiAgZmV0Y2hDdWlzaW5lcygpO1xufSk7XG5cbi8qKlxuICogRmV0Y2ggYWxsIG5laWdoYm9yaG9vZHMgYW5kIHNldCB0aGVpciBIVE1MLlxuICovXG5mZXRjaE5laWdoYm9yaG9vZHMgPSAoKSA9PiB7XG4gIERCSGVscGVyLmZldGNoTmVpZ2hib3Job29kcygoZXJyb3IsIG5laWdoYm9yaG9vZHMpID0+IHtcbiAgICBpZiAoZXJyb3IgIT0gbnVsbCkgeyAvLyBHb3QgYW4gZXJyb3JcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxmLm5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzO1xuICAgICAgZmlsbE5laWdoYm9yaG9vZHNIVE1MKCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogU2V0IG5laWdoYm9yaG9vZHMgSFRNTC5cbiAqL1xuXG5maWxsTmVpZ2hib3Job29kc0hUTUwgPSAobmVpZ2hib3Job29kcyA9IHNlbGYubmVpZ2hib3Job29kcykgPT4ge1xuICBjb25zdCBzZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcbiAgbmVpZ2hib3Job29kcy5mb3JFYWNoKChuZWlnaGJvcmhvb2QpID0+IHtcbiAgICBjb25zdCBvcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdvcHRpb24nKTtcbiAgICBvcHRpb24uaW5uZXJIVE1MID0gbmVpZ2hib3Job29kO1xuICAgIG9wdGlvbi52YWx1ZSA9IG5laWdoYm9yaG9vZDtcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgbmVpZ2hib3Job29kKTtcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdyb2xlJywgJ29wdGlvbicpO1xuICAgIHNlbGVjdC5hcHBlbmQob3B0aW9uKTtcbiAgICAvLyBzZWxlY3RbMF0uc2V0QXR0cmlidXRlKCdsYWJlbCcsc2VsZWN0WzBdLmlubmVySFRNTCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBGZXRjaCBhbGwgY3Vpc2luZXMgYW5kIHNldCB0aGVpciBIVE1MLlxuICovXG5cbmZldGNoQ3Vpc2luZXMgPSAoKSA9PiB7XG4gIERCSGVscGVyLmZldGNoQ3Vpc2luZXMoKGVycm9yLCBjdWlzaW5lcykgPT4ge1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5jdWlzaW5lcyA9IGN1aXNpbmVzO1xuICAgICAgZmlsbEN1aXNpbmVzSFRNTCgpO1xuICAgIH1cbiAgfSk7XG59O1xuXG4vKipcbiAqIFNldCBjdWlzaW5lcyBIVE1MLlxuICovXG5cbmZpbGxDdWlzaW5lc0hUTUwgPSAoY3Vpc2luZXMgPSBzZWxmLmN1aXNpbmVzKSA9PiB7XG4gIGNvbnN0IHNlbGVjdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdWlzaW5lcy1zZWxlY3QnKTtcblxuICBjdWlzaW5lcy5mb3JFYWNoKChjdWlzaW5lKSA9PiB7XG4gICAgY29uc3Qgb3B0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnb3B0aW9uJyk7XG4gICAgb3B0aW9uLmlubmVySFRNTCA9IGN1aXNpbmU7XG4gICAgb3B0aW9uLnZhbHVlID0gY3Vpc2luZTtcbiAgICBvcHRpb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgY3Vpc2luZSk7XG4gICAgb3B0aW9uLnNldEF0dHJpYnV0ZSgncm9sZScsICdvcHRpb24nKTtcbiAgICBzZWxlY3QuYXBwZW5kKG9wdGlvbik7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXG4gKi9cblxud2luZG93LmluaXRNYXAgPSAoKSA9PiB7XG4gIGxldCBsb2MgPSB7XG4gICAgbGF0OiA0MC43MjIyMTYsXG4gICAgbG5nOiAtNzMuOTg3NTAxLFxuICB9O1xuXG4gIHNlbGYubWFwID0gbmV3IGdvb2dsZS5tYXBzLk1hcChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJyksIHtcbiAgICB6b29tOiAxMixcbiAgICBjZW50ZXI6IGxvYyxcbiAgICBzY3JvbGx3aGVlbDogZmFsc2UsXG4gIH0pO1xuXG4gIHVwZGF0ZVJlc3RhdXJhbnRzKCk7XG59O1xuXG4vKipcbiAqIFVwZGF0ZSBwYWdlIGFuZCBtYXAgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMuXG4gKi9cblxudXBkYXRlUmVzdGF1cmFudHMgPSAoKSA9PiB7XG4gIGNvbnN0IGNTZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3Vpc2luZXMtc2VsZWN0Jyk7XG4gIGNvbnN0IG5TZWxlY3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmVpZ2hib3Job29kcy1zZWxlY3QnKTtcblxuICBjb25zdCBjSW5kZXggPSBjU2VsZWN0LnNlbGVjdGVkSW5kZXg7XG4gIGNvbnN0IG5JbmRleCA9IG5TZWxlY3Quc2VsZWN0ZWRJbmRleDtcblxuICBjb25zdCBjdWlzaW5lID0gY1NlbGVjdFtjSW5kZXhdLnZhbHVlO1xuXG4gIC8vIGNTZWxlY3RbMF0uc2V0QXR0cmlidXRlKCdsYWJlbCcsY1NlbGVjdFswXS5pbm5lckhUTUwpO1xuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBuU2VsZWN0W25JbmRleF0udmFsdWU7XG5cbiAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlDdWlzaW5lQW5kTmVpZ2hib3Job29kKGN1aXNpbmUsIG5laWdoYm9yaG9vZCwgKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzZXRSZXN0YXVyYW50cyhyZXN0YXVyYW50cyk7XG4gICAgICBmaWxsUmVzdGF1cmFudHNIVE1MKCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogQ2xlYXIgY3VycmVudCByZXN0YXVyYW50cywgdGhlaXIgSFRNTCBhbmQgcmVtb3ZlIHRoZWlyIG1hcCBtYXJrZXJzLlxuICovXG5cbnJlc2V0UmVzdGF1cmFudHMgPSAocmVzdGF1cmFudHMpID0+IHtcbiAgLy8gUmVtb3ZlIGFsbCByZXN0YXVyYW50c1xuICBzZWxmLnJlc3RhdXJhbnRzID0gW107XG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcbiAgdWwuaW5uZXJIVE1MID0gJyc7XG5cbiAgLy8gUmVtb3ZlIGFsbCBtYXAgbWFya2Vyc1xuICBzZWxmLm1hcmtlcnMuZm9yRWFjaCgobSkgPT4gbS5zZXRNYXAobnVsbCkpO1xuICBzZWxmLm1hcmtlcnMgPSBbXTtcbiAgc2VsZi5yZXN0YXVyYW50cyA9IHJlc3RhdXJhbnRzO1xufTtcblxuLyoqXG4gKiBDcmVhdGUgYWxsIHJlc3RhdXJhbnRzIEhUTUwgYW5kIGFkZCB0aGVtIHRvIHRoZSB3ZWJwYWdlLlxuICovXG5cbmZpbGxSZXN0YXVyYW50c0hUTUwgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XG4gIGNvbnN0IHVsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnRzLWxpc3QnKTtcbiAgcmVzdGF1cmFudHMuZm9yRWFjaCgocmVzdGF1cmFudCkgPT4ge1xuICAgIHVsLmFwcGVuZChjcmVhdGVSZXN0YXVyYW50SFRNTChyZXN0YXVyYW50KSk7XG4gIH0pO1xuICBhZGRNYXJrZXJzVG9NYXAoKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIHJlc3RhdXJhbnQgSFRNTC5cbiAqL1xuXG5jcmVhdGVSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50KSA9PiB7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2xpc3RpdGVtJyk7XG4gIGxpLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMCcpO1xuXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJyk7XG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XG4gIGltYWdlLnNldEF0dHJpYnV0ZSgncm9sZScsICdpbWcnKTtcbiAgaW1hZ2UuZGF0YXNldC5zcmMgPSBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XG4gIC8vIGltYWdlLnNldEF0dHJpYnV0ZSgnZGF0YS1zcmMnLCBEQkhlbHBlci5pbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkpO1xuXG4gIGNvbnN0IG5hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcbiAgLyogdW5pcXVlIGFsdCBmb3IgdGhlIGltYWdlICovXG4gIGltYWdlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIG5hbWUuaW5uZXJIVE1MKycgcmVzdGF1cmFudCcpO1xuICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2FsdCcsIG5hbWUuaW5uZXJIVE1MKycgcmVzdGF1cmFudCcpO1xuXG4gIGxpLmFwcGVuZChpbWFnZSk7XG4gIGxpLmFwcGVuZChuYW1lKTtcblxuICBjb25zdCBuZWlnaGJvcmhvb2QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIG5laWdoYm9yaG9vZC5pbm5lckhUTUwgPSByZXN0YXVyYW50Lm5laWdoYm9yaG9vZDtcbiAgbGkuYXBwZW5kKG5laWdoYm9yaG9vZCk7XG5cbiAgY29uc3QgYWRkcmVzcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgYWRkcmVzcy5pbm5lckhUTUwgPSByZXN0YXVyYW50LmFkZHJlc3M7XG4gIGxpLmFwcGVuZChhZGRyZXNzKTtcblxuICBjb25zdCBtb3JlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICBtb3JlLmlubmVySFRNTCA9ICdWaWV3IERldGFpbHMnO1xuICBtb3JlLnNldEF0dHJpYnV0ZSgncm9sZScsICdsaW5rJyk7XG4gIG1vcmUuaHJlZiA9IERCSGVscGVyLnVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCk7XG4gIGxpLmFwcGVuZChtb3JlKTtcbiAgY29uc3QgYmFkZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gIGlmIChyZXN0YXVyYW50LmlzX2Zhdm9yaXRlPT09J3RydWUnKSB7XG4gICAgYmFkZ2UuaW5uZXJIVE1MKz1gPGJ1dHRvbiB0YWJpbmRleD1cIjBcIiBhcmlhLWxhYmVsPVwiTWFyayBhcyBmYXZvcml0ZSBwbGFjZVwiIGNsYXNzPVwiZmF2b3JpdGVcIiBkaXNhYmxlZD48L2J1dHRvbj5gO1xuICB9IGVsc2Uge1xuICAgIGJhZGdlLmlubmVySFRNTCs9YDxidXR0b24gdGFiaW5kZXg9XCIwXCIgYXJpYS1sYWJlbD1cIk1hcmsgYXMgdW5mYXZvcml0ZSBwbGFjZVwiIGNsYXNzPVwidW5fZmF2b3JpdGVcIiBkaXNhYmxlZD48L2J1dHRvbj5gO1xuICB9XG4gIGxpLmFwcGVuZChiYWRnZSk7XG4gIHJldHVybiBsaTtcbn07XG5cbi8qKlxuICogQWRkIG1hcmtlcnMgZm9yIGN1cnJlbnQgcmVzdGF1cmFudHMgdG8gdGhlIG1hcC5cbiAqL1xuXG5hZGRNYXJrZXJzVG9NYXAgPSAocmVzdGF1cmFudHMgPSBzZWxmLnJlc3RhdXJhbnRzKSA9PiB7XG4gIHJlc3RhdXJhbnRzLmZvckVhY2goKHJlc3RhdXJhbnQpID0+IHtcbiAgICAvLyBBZGQgbWFya2VyIHRvIHRoZSBtYXBcbiAgICBjb25zdCBtYXJrZXIgPSBEQkhlbHBlci5tYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIHNlbGYubWFwKTtcbiAgICBnb29nbGUubWFwcy5ldmVudC5hZGRMaXN0ZW5lcihtYXJrZXIsICdjbGljaycsICgpID0+IHtcbiAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbWFya2VyLnVybDtcbiAgICB9KTtcbiAgICBzZWxmLm1hcmtlcnMucHVzaChtYXJrZXIpO1xuICB9KTtcbn07XG4iXX0=
