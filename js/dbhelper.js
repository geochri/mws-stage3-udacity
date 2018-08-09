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

    return idb.open('restaurantDb', 1, function(upgradeDb) {
      upgradeDb.createObjectStore('restaurantDb', {
        keyPath: 'id'});
      // store.createIndex('by-id','id');
    });
  }

  /**
   * Create Review Database!
   */

   static openReviewDatabase() {
     return idb.open('reviewsDb', 1, function(upgradeDb) {
       upgradeDb.createObjectStore('reviewsDb', {
        keyPath: 'id'}).createIndex('restaurant_id', 'restaurant_id');
     });
   }

   /**
    * Save data to ReviewsDatabase
    */

   static saveReviewsDatabase(data) {
     return DBHelper.openReviewDatabase().then((db) => {
       if (!db) return;
       let tx = db.transaction('reviewsDb', 'readwrite');
       let store = tx.objectStore('reviewsDb');
       data.forEach((review) => {
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
     return dbpromise.then((db) => {
       if (!db) return;
       let tx = db.transaction('reviewsDb');
       let store = tx.objectStore('reviewsDb');
       return store.getAll();
     }).then((res) => {
       num=res.filter((r) => r.restaurant_id==parseInt(id)).length;
       //console.log(num)
       return res.filter((r) => r.restaurant_id==parseInt(id));
     }).catch((error) => console.log(error));
   }

   /**
    * Update the Review Database after post!
    */

   static updateReviewsDb(review) {
     return DBHelper.openReviewDatabase().then((db) => {
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
      return idb.open('outbox', 1, function(upgradeDb) {
        upgradeDb.createObjectStore('outbox', {
        keyPath: 'createdAt'});
      });
    }

    /**
     * Review Saving on Outbox Database
     */

    static saveOutboxDatabase(data) {
      return DBHelper.openOutboxDatabase().then((db) => {
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
      if (navigator.onLine && reviews.length>0) {
        reviews.forEach((review) => {
          fetch('http://localhost:1337/reviews/', {
            method: 'POST',
            body: JSON.stringify(review),
          }).then(clearOutbox());
        });
      }
    }

    /**
     * Clearing Outbox Database!
     */

    static clearOutbox() {
      if (navigator.onLine) {
      return DBHelper.openOutboxDatabase().then((db) =>{
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
        return DBHelper.openOutboxDatabase().then((db) => {
          let tx = db.transaction('outbox');
          let store = tx.objectStore('outbox');
          return store.getAll();
        }).then((response) => {
          // pendingForSubmitReviews(response);
          response.forEach(function(review) {
            //const rev = {
            //  'restaurant_id': review.restaurant_id,
            //  'name': review.name,
            //  'rating': review.rating,
          //    'comments': review.comments,
            //  'createdAt': review.createdAt
          //  };

            fetch('http://localhost:1337/reviews/', {
              method: 'POST', body: JSON.stringify(review)
            }).then((result) => {
                self.reviews.push(result);
                // DBHelper.updateReviewsDb(result);
                let data = {
                    'restaurant_id': review.restaurant_id,
                    'name': review.name,
                    'rating': review.rating,
                    'comments': review.comments,
                    'createdAt': review.createdAt,
                    'id': num+100
                }
                DBHelper.updateReviewsDb(data);
              }).catch((er) => {
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
    return DBHelper.openDatabase().then(function(db) {
      if (!db) return;
      let tx = db.transaction('restaurantDb', 'readwrite');
      let store = tx.objectStore('restaurantDb');
      data.forEach(function(restaurant) {
        store.put(restaurant);
      });
      return tx.complete;
    });
  }


  /*
   * Update entry on Restaurantdatabase !
   */

  static updateDb(id, val) {
    return DBHelper.openDatabase().then((db) => {
      let tx = db.transaction('restaurantDb');
      let store = tx.objectStore('restaurantDb');
      return store.get(id, 'is_favorite');
    }).then((object) => {
       // IDB test search output
      // console.log(object);
      object.is_favorite = val;
      DBHelper.openDatabase().then((db) => {
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
    return dbpromise.then(function(db) {
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
    return fetch(DBHelper.DATABASE_URL)
      .then(function(response) {
        return response.json();
      }).then((restaurants) => {
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

    return DBHelper.getCachedDb().then((restaurants) => {
      if (restaurants.length) {
        return Promise.resolve(restaurants);
      }
      else {
        return DBHelper.fromApi();
      }
    }).then((restaurants) => {
        callback(null, restaurants);
      })
      .catch((er) => {
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
        const restaurant = restaurants.find((r) => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        }
        else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    );
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */

  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      }
      else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter((r) => r.cuisine_type == cuisine);
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
      }
 else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter((r) => r.neighborhood == neighborhood);
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
      }
 else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter((r) => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter((r) => r.neighborhood == neighborhood);
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
      }
 else {
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
      }
      else {
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
    return fetch('http://localhost:1337/reviews')
      .then(function(response) {
        return response.json();
      }).then((reviews) => {
          callback(null, reviews);
        })
        .catch((er) => {
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
      return DBHelper.reviewsGetCached(id).then((reviews) => {
        if (reviews.length>1) {
          // let data = reviews.filter((r) => r.restaurant_id == self.restaurant.id);
          return Promise.resolve(reviews);
        } else {
          return fetch('http://localhost:1337/reviews/?restaurant_id='+ id)
            .then(function(response) {
              return response.json();
            }).then((reviews) => {
              DBHelper.saveReviewsDatabase(reviews);
              return reviews;
            });
        }
      }).then((reviews) => {
        callback(null, reviews);
        return
      }).catch((error) => {
        callback(error, null);
      });
  }


  /**
   * Post Reviews
   */

   static postReviews(review) {
     return fetch('http://localhost:1337/reviews/', {method: 'POST', body: review})
      .then(function(response) {
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
      if (self.restaurant.is_favorite==='true') {
        mark = `http://localhost:1337/restaurants/${restaurant}/?is_favorite=true`;
        console.log(mark);
      } else if (self.restaurant.is_favorite==='false') {
        mark = `http://localhost:1337/restaurants/${restaurant}/?is_favorite=false`;
        console.log(mark);
      }

      return fetch(mark, {method: 'PUT'})
         .then(function(response) {
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
    return (`./restaurant.html?id=${restaurant.id}`);
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
        return (`/img/${restaurant.photograph}.webp`);
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
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
}
