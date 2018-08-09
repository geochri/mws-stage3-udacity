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

let restaurant;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      document.getElementById('map').setAttribute('role', 'application');

      fillBreadcrumb();

      /*
      document.getElementById('map').setAttribute('role','application');
      document.getElementById('map').setAttribute('tabindex','4');
      document.getElementById('map').setAttribute('aria-hidden','true');
      */
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */

fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */

fillRestaurantHTML = (restaurant = self.restaurant) => {
  self.is_favorite = restaurant.is_favorite;
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  if (restaurant.is_favorite === 'true') {
    name.innerHTML += `<button tabindex="0" aria-label="Mark as unfavorite place" onclick="favButton(this)" class="favorite"></button>`;
  } else {
    name.innerHTML += `<button tabindex="0" aria-label="Mark as favorite place" onclick="favButton(this)" class="un_favorite"></button>`;
  }
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  /* unique alt-arialabel */
  image.setAttribute('aria-label', name.innerHTML + ' restaurant');
  image.setAttribute('alt', name.innerHTML + ' restaurant');

  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  DBHelper.processAllPendingReviews();
  DBHelper.clearOutbox();
  fetchReviewUrl();
  /*
  const container = document.getElementById('reviews-container');
  const addReviewButton = document.createElement('button');
  addReviewButton.innerHTML('Add Review');
  addReviewButton.setAttribute('role', 'button');
  addReviewButton.setAttribute('id', 'addReviewButton');
  container.appendChild(addReviewButton);
  */
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */

fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    day.style.color = '#525252';
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.style.color = '#525252';

    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Favorite Restaurant button
 */

favButton = element => {
  if (self.is_favorite === 'true') {
    element.classList.remove('favorite');
    element.classList.add('un_favorite');
    self.restaurant.is_favorite = 'false';
    self.is_favorite = 'false';
    element.setAttribute('aria-label', 'Mark as favorite');
    // DBHelper.markFavorite(self.restaurant.id);
  } else {
    self.restaurant.is_favorite = 'true';
    self.is_favorite = 'true';
    element.setAttribute('aria-label', 'Mark as unfavorite');
    element.classList.remove('un_favorite');
    element.classList.add('favorite');
    //  DBHelper.markFavorite(self.restaurant.id);
  }
  DBHelper.markFavorite(self.restaurant.id);
  return DBHelper.updateDb(self.restaurant.id, self.restaurant.is_favorite);
};

/**
 * Create all reviews HTML and add them to the webpage.
 */

fetchReviewUrl = () => {
  if (self.review) {
    // restaurant already fetched!
    // callback(null, self.restaurant)
    return;
  }

  const id = getParameterByName('id');

  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    // callback(error, null);
  } else {
    DBHelper.fetchReviewById(id, (error, reviews) => {

      self.reviews = reviews;

      if (!reviews) {
        console.error(error);
        fillReviewsHTML(null);
        return;
      }
      fillReviewsHTML();
    });
  }
};

/**
 * Create Add Review Button with style settings
 */

addReviewButton = () => {
  const container = document.getElementById('reviews-container');
  const addReviewButton = document.createElement('button');
  const addReviewButton2 = document.createElement('a');

  addReviewButton2.innerHTML = 'Add Review';
  addReviewButton.setAttribute('role', 'button');
  addReviewButton.setAttribute('id', 'addReviewButton');
  addReviewButton.setAttribute('onclick', 'reviewForm()');
  addReviewButton2.style.color = '#fff';
  addReviewButton.style.backgroundColor = '#854400';
  addReviewButton.style.height = '35px';
  addReviewButton.style.width = '100px';
  addReviewButton.style.margin = '10px';
  addReviewButton.style.padding = '10px';
  container.appendChild(addReviewButton);
  // activate state setting
  addReviewButton.disable = false;
  addReviewButton.hidden = false;
  // bookmark setting!
  addReviewButton2.setAttribute('href', '#reviewForm');
  addReviewButton.appendChild(addReviewButton2);
};

reviewForm = () => {
  const addReviewButton = document.getElementById('addReviewButton');
  // de-activate state setting
  addReviewButton.disable = true;
  addReviewButton.hidden = true;
  // Create the Review Form with settings
  const reviewForm = document.createElement('form');
  reviewForm.setAttribute('class', 'review_form');
  reviewForm.id = 'reviewForm';
  reviewForm.setAttribute('role', 'form');
  reviewForm.setAttribute('tabindex', '14');
  reviewForm.setAttribute('order', '0');
  const reviewslist = document.getElementById('reviews-list');
  reviewslist.setAttribute('order', '1');
  const reviewHeader = document.createElement('h2');
  reviewHeader.innerHTML = 'Review Form for';
  reviewHeader.setAttribute('role', 'h2');
  reviewHeader.id = 'reviewHeader';
  const reviewRestaurant = document.createElement('h3');
  reviewRestaurant.innerHTML = self.restaurant.name;
  reviewRestaurant.setAttribute('role', 'h3');
  reviewRestaurant.id = 'reviewRestaurant';
  const reviewName = document.createElement('label');
  reviewName.innerHTML = 'Name:';
  reviewName.setAttribute('for', 'name');
  reviewName.id = 'reviewName';
  reviewName.setAttribute('role', 'label');
  const reviewInputName = document.createElement('input');
  reviewInputName.id = 'reviewInputName';
  reviewInputName.setAttribute('role', 'input');
  reviewInputName.setAttribute('name', 'name');
  reviewInputName.setAttribute('placeholder', 'Enter your Name..');
  reviewInputName.setAttribute('required', 'true');
  const reviewRating = document.createElement('label');
  reviewRating.id = 'reviewRating';
  reviewRating.setAttribute('role', 'label');
  reviewRating.setAttribute('for', 'rating');
  reviewRating.innerHTML = 'Rating:';
  reviewRating.min = '1';
  reviewRating.max = '5';
  const reviewInputRating = document.createElement('input');
  reviewInputRating.id = 'reviewInputRating';
  reviewInputRating.setAttribute('name', 'rating');
  reviewInputRating.setAttribute('role', 'input');
  reviewInputRating.setAttribute('placeholder', 'Enter your Rating.. From 1 to 5.');
  reviewInputRating.setAttribute('required', 'true');
  const reviewComments = document.createElement('label');
  reviewComments.id = 'reviewComments';
  reviewComments.setAttribute('role', 'label');
  reviewComments.setAttribute('for', 'comments');
  reviewComments.innerHTML = 'Comments:';
  const reviewInputComments = document.createElement('textarea');
  reviewInputComments.id = 'reviewInputComments';
  reviewInputComments.setAttribute('role', 'input');
  reviewInputComments.setAttribute('name', 'comments');
  reviewInputComments.setAttribute('placeholder', 'Enter your Comments here.. Minimum 90 characters!');
  reviewInputComments.setAttribute('required', 'true');
  const reviewSubmit = document.createElement('button');
  reviewSubmit.id = 'reviewSubmit';
  reviewSubmit.setAttribute('role', 'button');
  reviewSubmit.setAttribute('type', 'button');
  reviewSubmit.innerHTML = 'Submit';
  reviewSubmit.setAttribute('onclick', 'addReview()');
  // Connect the Element with childs
  addChildIntoElement(reviewForm, [reviewHeader, reviewRestaurant, reviewName, reviewInputName, reviewRating, reviewInputRating, reviewComments, reviewInputComments, reviewSubmit]);
  const container = document.getElementById('reviews-container');
  container.appendChild(reviewForm);
  /**
   * Form Styles
   */
  reviewForm.style.height = '400px';
  reviewForm.style.display = 'flex';
  reviewForm.style.flexDirection = 'column';
  reviewInputRating.style.width = '150px';
  reviewInputRating.style.marginBottom = '5px';
  reviewInputName.style.width = '150px';
  reviewInputName.style.marginBottom = '5px';
  reviewInputComments.style.height = '100px';
  reviewInputComments.style.width = '90%';
  reviewInputComments.style.marginBottom = '5px';
  reviewSubmit.style.width = '100px';
  reviewHeader.style.marginBottom = '10px';
  reviewRestaurant.style.marginBottom = '5px';
};

/**
 * Form Validation with the comment limitation!
 */

checkValidation = checklist => {
  let valid = true;

  if (checklist[0] === '' || checklist[1] < 1 || checklist[1] > 5 || checklist[1] === '' || checklist[2] === '' || checklist[3] <= 90) {
    valid = false;
    let errorMessage = 'Error! Please fill the empty field, or fix the the invalid input!\nKeep in mind the minimum characters for the comment are 90!!!';
    console.log(errorMessage);
    alert(errorMessage);
  }
  return valid;
};

/**
 * Check, Post, Refresh!!
 */

addReview = () => {
  let reviewInputName = document.getElementById('reviewForm')[0];
  let reviewInputRating = document.getElementById('reviewForm')[1];
  let reviewInputComments = document.getElementById('reviewForm')[2];
  const review = {
    'restaurant_id': self.restaurant.id,
    'name': reviewInputName.value,
    'rating': reviewInputRating.value,
    'comments': reviewInputComments.value,
    'createdAt': Date.now()
  };
  lista = [reviewInputName.value, reviewInputRating.value, reviewInputComments.value, reviewInputComments.textLength];
  if (checkValidation(lista)) {
    if (navigator.onLine) {
      DBHelper.postReviews(JSON.stringify(review)).then(result => {
        self.reviews.push(result);
        // fillReviewsHTML();
        DBHelper.updateReviewsDb(result);
        setTimeout(() => {
          window.location.reload();
        }, 100);
        alert('Status of Submited Review: Success!');
      }).catch(err => {
        self.reviews.push(review);
        //  fillReviewsHTML();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    } else if (!navigator.onLine) {
      DBHelper.saveOutboxDatabase(review);
      //alert('Warning!!!!\nYou are offline, your review is saved on outbox!\nYour review will be auto-submited when you will be online again!');
      //setTimeout(() => {
      //   window.location.reload();
      //}, 1000);
      let revForm = document.getElementById('reviewForm');
      revForm.reset();
    }
  }
};

/**
 * Connection Constructor appendChild
 */

addChildIntoElement = (element, children) => {
  children.forEach(child => {
    element.appendChild(child);
  });
};

fillReviewsHTML = (reviews = self.reviews) => {
  /*
  if (!reviews) {
  DBHelper.fetchReviewById(self.restaurant.id).then(function(response) {
    self.reviews =response;
    fillReviewsHTML();
  });
  } */
  // let duplicateItem = document.getElementsByTagName('h2')[1];
  // let duplicateItem2 = document.getElementsByTagName('p')[3];

  //  if (duplicateItem) {
  //    duplicateItem.remove();
  // duplicateItem2.remove();
  //  }
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  // Add Review button !
  addReviewButton();
  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */

createReviewHTML = review => {
  const li = document.createElement('li');
  /* screener settings */
  li.setAttribute('tabindex', '13');
  li.setAttribute('role', 'listitem');
  /* name settings */
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.style.textAlign = 'left';
  name.style.width = '50%';
  name.style.order = '0';
  name.style.fontWeight = 'bold';
  name.style.fontSize = '16px';
  name.style.color = '#932C2A';

  li.appendChild(name);
  /* date settings */
  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toGMTString();
  date.style.textAlign = 'right';
  date.style.width = '50%';
  date.style.fontSize = '16px';
  date.style.fontStyle = 'oblique';
  date.style.textDecoration = 'underline';
  date.style.order = '0';

  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  /* Rating settings */
  rating.style.backgroundColor = '#333333';
  rating.style.borderRadius = '5px 5px';
  rating.style.textAlign = 'center';
  rating.style.fontWeight = 'bold';
  rating.style.fontSize = '17px';
  rating.style.height = '25px';
  rating.style.width = '100px';
  rating.style.color = '#FFB52E';
  rating.style.order = '1';

  li.appendChild(rating);
  /* comment settings */
  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.style.order = '2';
  comments.style.lineHeight = '1.6';
  comments.style.textAlign = 'justify';

  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */

fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */

getParameterByName = (name, url) => {
  if (!url) {
    url = window.location.href;
  }
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) {
    return null;
  }
  if (!results[2]) {
    return '';
  }
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImRiaGVscGVyLmpzIiwicmVzdGF1cmFudF9pbmZvLmpzIl0sIm5hbWVzIjpbImRicHJvbWlzZSIsIm51bSIsIkRCSGVscGVyIiwiREFUQUJBU0VfVVJMIiwicG9ydCIsIm9wZW5EYXRhYmFzZSIsImlkYiIsIm9wZW4iLCJ1cGdyYWRlRGIiLCJjcmVhdGVPYmplY3RTdG9yZSIsImtleVBhdGgiLCJvcGVuUmV2aWV3RGF0YWJhc2UiLCJjcmVhdGVJbmRleCIsInNhdmVSZXZpZXdzRGF0YWJhc2UiLCJkYXRhIiwidGhlbiIsImRiIiwidHgiLCJ0cmFuc2FjdGlvbiIsInN0b3JlIiwib2JqZWN0U3RvcmUiLCJmb3JFYWNoIiwicmV2aWV3IiwicHV0IiwiY29tcGxldGUiLCJyZXZpZXdzR2V0Q2FjaGVkIiwiaWQiLCJnZXRBbGwiLCJyZXMiLCJmaWx0ZXIiLCJyIiwicmVzdGF1cmFudF9pZCIsInBhcnNlSW50IiwibGVuZ3RoIiwiY2F0Y2giLCJlcnJvciIsImNvbnNvbGUiLCJsb2ciLCJ1cGRhdGVSZXZpZXdzRGIiLCJhZGQiLCJvcGVuT3V0Ym94RGF0YWJhc2UiLCJzYXZlT3V0Ym94RGF0YWJhc2UiLCJwZW5kaW5nRm9yU3VibWl0UmV2aWV3cyIsInJldmlld3MiLCJuYXZpZ2F0b3IiLCJvbkxpbmUiLCJmZXRjaCIsIm1ldGhvZCIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5IiwiY2xlYXJPdXRib3giLCJjbGVhciIsInByb2Nlc3NBbGxQZW5kaW5nUmV2aWV3cyIsInJlc3BvbnNlIiwicmVzdWx0Iiwic2VsZiIsInB1c2giLCJuYW1lIiwicmF0aW5nIiwiY29tbWVudHMiLCJjcmVhdGVkQXQiLCJlciIsImNhbGxiYWNrIiwic2F2ZURhdGFiYXNlIiwicmVzdGF1cmFudCIsInVwZGF0ZURiIiwidmFsIiwiZ2V0Iiwib2JqZWN0IiwiaXNfZmF2b3JpdGUiLCJnZXRDYWNoZWREYiIsImZyb21BcGkiLCJqc29uIiwicmVzdGF1cmFudHMiLCJmZXRjaFJlc3RhdXJhbnRzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJmZXRjaFJlc3RhdXJhbnRCeUlkIiwiZmluZCIsImZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZSIsImN1aXNpbmUiLCJyZXN1bHRzIiwiY3Vpc2luZV90eXBlIiwiZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QiLCJuZWlnaGJvcmhvb2QiLCJmZXRjaFJlc3RhdXJhbnRCeUN1aXNpbmVBbmROZWlnaGJvcmhvb2QiLCJmZXRjaE5laWdoYm9yaG9vZHMiLCJuZWlnaGJvcmhvb2RzIiwibWFwIiwidiIsImkiLCJ1bmlxdWVOZWlnaGJvcmhvb2RzIiwiaW5kZXhPZiIsImZldGNoQ3Vpc2luZXMiLCJjdWlzaW5lcyIsInVuaXF1ZUN1aXNpbmVzIiwiZmV0Y2hSZXZpZXciLCJmZXRjaFJldmlld0J5SWQiLCJwb3N0UmV2aWV3cyIsIm9rIiwibWFya0Zhdm9yaXRlIiwibWFyayIsInVybEZvclJlc3RhdXJhbnQiLCJpbWFnZVVybEZvclJlc3RhdXJhbnQiLCJwaG90b2dyYXBoIiwibWFwTWFya2VyRm9yUmVzdGF1cmFudCIsIm1hcmtlciIsImdvb2dsZSIsIm1hcHMiLCJNYXJrZXIiLCJwb3NpdGlvbiIsImxhdGxuZyIsInRpdGxlIiwidXJsIiwiYW5pbWF0aW9uIiwiQW5pbWF0aW9uIiwiRFJPUCIsIndpbmRvdyIsImluaXRNYXAiLCJmZXRjaFJlc3RhdXJhbnRGcm9tVVJMIiwiTWFwIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInpvb20iLCJjZW50ZXIiLCJzY3JvbGx3aGVlbCIsInNldEF0dHJpYnV0ZSIsImZpbGxCcmVhZGNydW1iIiwiZ2V0UGFyYW1ldGVyQnlOYW1lIiwiZmlsbFJlc3RhdXJhbnRIVE1MIiwiaW5uZXJIVE1MIiwiYWRkcmVzcyIsImltYWdlIiwiY2xhc3NOYW1lIiwic3JjIiwib3BlcmF0aW5nX2hvdXJzIiwiZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwiLCJmZXRjaFJldmlld1VybCIsIm9wZXJhdGluZ0hvdXJzIiwiaG91cnMiLCJrZXkiLCJyb3ciLCJjcmVhdGVFbGVtZW50IiwiZGF5Iiwic3R5bGUiLCJjb2xvciIsImFwcGVuZENoaWxkIiwidGltZSIsImZhdkJ1dHRvbiIsImVsZW1lbnQiLCJjbGFzc0xpc3QiLCJyZW1vdmUiLCJmaWxsUmV2aWV3c0hUTUwiLCJhZGRSZXZpZXdCdXR0b24iLCJjb250YWluZXIiLCJhZGRSZXZpZXdCdXR0b24yIiwiYmFja2dyb3VuZENvbG9yIiwiaGVpZ2h0Iiwid2lkdGgiLCJtYXJnaW4iLCJwYWRkaW5nIiwiZGlzYWJsZSIsImhpZGRlbiIsInJldmlld0Zvcm0iLCJyZXZpZXdzbGlzdCIsInJldmlld0hlYWRlciIsInJldmlld1Jlc3RhdXJhbnQiLCJyZXZpZXdOYW1lIiwicmV2aWV3SW5wdXROYW1lIiwicmV2aWV3UmF0aW5nIiwibWluIiwibWF4IiwicmV2aWV3SW5wdXRSYXRpbmciLCJyZXZpZXdDb21tZW50cyIsInJldmlld0lucHV0Q29tbWVudHMiLCJyZXZpZXdTdWJtaXQiLCJhZGRDaGlsZEludG9FbGVtZW50IiwiZGlzcGxheSIsImZsZXhEaXJlY3Rpb24iLCJtYXJnaW5Cb3R0b20iLCJjaGVja1ZhbGlkYXRpb24iLCJjaGVja2xpc3QiLCJ2YWxpZCIsImVycm9yTWVzc2FnZSIsImFsZXJ0IiwiYWRkUmV2aWV3IiwidmFsdWUiLCJEYXRlIiwibm93IiwibGlzdGEiLCJ0ZXh0TGVuZ3RoIiwic2V0VGltZW91dCIsImxvY2F0aW9uIiwicmVsb2FkIiwiZXJyIiwicmV2Rm9ybSIsInJlc2V0IiwiY2hpbGRyZW4iLCJjaGlsZCIsIm5vUmV2aWV3cyIsInVsIiwiY3JlYXRlUmV2aWV3SFRNTCIsImxpIiwidGV4dEFsaWduIiwib3JkZXIiLCJmb250V2VpZ2h0IiwiZm9udFNpemUiLCJkYXRlIiwidG9HTVRTdHJpbmciLCJmb250U3R5bGUiLCJ0ZXh0RGVjb3JhdGlvbiIsImJvcmRlclJhZGl1cyIsImxpbmVIZWlnaHQiLCJicmVhZGNydW1iIiwiaHJlZiIsInJlcGxhY2UiLCJyZWdl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LG1CQUFtQjFJLFFBQVEsQ0FBUixFQUFXc0ksT0FBWCxDQUFtQixLQUFuQixFQUEwQixHQUExQixDQUFuQixDQUFQO0FBQ0QsQ0FkRCIsImZpbGUiOiJyZXN0YXVyYW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50IFwicmVxdWlyZS1qc2RvY1wiOiBbXCJlcnJvclwiLCB7XG4gICAgXCJyZXF1aXJlXCI6IHtcbiAgICAgICAgXCJGdW5jdGlvbkRlY2xhcmF0aW9uXCI6IHRydWUsXG4gICAgICAgIFwiTWV0aG9kRGVmaW5pdGlvblwiOiBmYWxzZSxcbiAgICAgICAgXCJDbGFzc0RlY2xhcmF0aW9uXCI6IGZhbHNlLFxuICAgICAgICBcIkFycm93RnVuY3Rpb25FeHByZXNzaW9uXCI6IGZhbHNlLFxuICAgICAgICBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOiBmYWxzZVxuICAgIH1cbn1dKi9cbi8qIGVzbGludCB2YWxpZC1qc2RvYzogXCJlcnJvclwiKi9cbi8qIGVzbGludCBtYXgtbGVuOiBbXCJlcnJvclwiLCB7IFwiY29kZVwiOiAyMDAgfV0qL1xuLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiBbXCJlcnJvclwiLCB7IFwidmFyc1wiOiBcImxvY2FsXCIgfV0qL1xuLyogZXNsaW50IGJyYWNlLXN0eWxlOiBbMCx7IFwiYWxsb3dTaW5nbGVMaW5lXCI6IHRydWUgfV0qL1xuLy8gaW1wb3J0IGlkYiBmcm9tIFwiaWRiXCI7XG5cbi8qKlxuICogQ29tbW9uIGRhdGFiYXNlIGhlbHBlciBmdW5jdGlvbnMuXG4gKi9cbmxldCBkYnByb21pc2U7XG5sZXQgbnVtO1xuY2xhc3MgREJIZWxwZXIge1xuICAvKlxuICAgKiBEYXRhYmFzZSBVUkwuXG4gICAqIENoYW5nZSB0aGlzIHRvIHJlc3RhdXJhbnRzLmpzb24gZmlsZSBsb2NhdGlvbiBvbiB5b3VyIHNlcnZlci5cbiAgICovXG4vLyAgY29uc3QgcG9ydCA9ICcxMzM3Jztcbi8vICBjb25zdCBob3N0ID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6JztcblxuXG4gIHN0YXRpYyBnZXQgREFUQUJBU0VfVVJMKCkge1xuICAgLypcbiAgICAqIGNvbnN0IHBvcnQgPSA4MDAwIC8vIENoYW5nZSB0aGlzIHRvIHlvdXIgc2VydmVyIHBvcnRcbiAgICAqIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L2RhdGEvcmVzdGF1cmFudHMuanNvbmA7XG4gICAgKi9cbiAgICBjb25zdCBwb3J0ID0gMTMzNzsgLy8gQ2hhbmdlIHRoaXMgdG8geW91ciBzZXJ2ZXIgcG9ydFxuICAgIHJldHVybiBgaHR0cDovL2xvY2FsaG9zdDoke3BvcnR9L3Jlc3RhdXJhbnRzYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgcmVzdGF1cmFudERhdGFiYXNlXG4gICAqL1xuXG4gIHN0YXRpYyBvcGVuRGF0YWJhc2UoKSB7XG4gICAgLy8gaWYgKCFuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcil7XG4gICAgLy8gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAvLyB9XG5cbiAgICByZXR1cm4gaWRiLm9wZW4oJ3Jlc3RhdXJhbnREYicsIDEsIGZ1bmN0aW9uKHVwZ3JhZGVEYikge1xuICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInLCB7XG4gICAgICAgIGtleVBhdGg6ICdpZCd9KTtcbiAgICAgIC8vIHN0b3JlLmNyZWF0ZUluZGV4KCdieS1pZCcsJ2lkJyk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIFJldmlldyBEYXRhYmFzZSFcbiAgICovXG5cbiAgIHN0YXRpYyBvcGVuUmV2aWV3RGF0YWJhc2UoKSB7XG4gICAgIHJldHVybiBpZGIub3BlbigncmV2aWV3c0RiJywgMSwgZnVuY3Rpb24odXBncmFkZURiKSB7XG4gICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdyZXZpZXdzRGInLCB7XG4gICAgICAgIGtleVBhdGg6ICdpZCd9KS5jcmVhdGVJbmRleCgncmVzdGF1cmFudF9pZCcsICdyZXN0YXVyYW50X2lkJyk7XG4gICAgIH0pO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFNhdmUgZGF0YSB0byBSZXZpZXdzRGF0YWJhc2VcbiAgICAqL1xuXG4gICBzdGF0aWMgc2F2ZVJldmlld3NEYXRhYmFzZShkYXRhKSB7XG4gICAgIHJldHVybiBEQkhlbHBlci5vcGVuUmV2aWV3RGF0YWJhc2UoKS50aGVuKChkYikgPT4ge1xuICAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbigncmV2aWV3c0RiJywgJ3JlYWR3cml0ZScpO1xuICAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXZpZXdzRGInKTtcbiAgICAgICBkYXRhLmZvckVhY2goKHJldmlldykgPT4ge1xuICAgICAgICAgc3RvcmUucHV0KHJldmlldyk7XG4gICAgICAgfSk7XG4gICAgICAgcmV0dXJuIHR4LmNvbXBsZXRlO1xuICAgICB9KTtcbiAgIH1cblxuICAgLyoqXG4gICAgKiBHZXR0aW5nIGRhdGEgZnJvbSBSZXZpZXdzRGF0YWJhc2VcbiAgICAqL1xuXG4gICBzdGF0aWMgcmV2aWV3c0dldENhY2hlZChpZCkge1xuICAgICBkYnByb21pc2UgPSBEQkhlbHBlci5vcGVuUmV2aWV3RGF0YWJhc2UoKTtcbiAgICAgcmV0dXJuIGRicHJvbWlzZS50aGVuKChkYikgPT4ge1xuICAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbigncmV2aWV3c0RiJyk7XG4gICAgICAgbGV0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ3Jldmlld3NEYicpO1xuICAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKTtcbiAgICAgfSkudGhlbigocmVzKSA9PiB7XG4gICAgICAgbnVtPXJlcy5maWx0ZXIoKHIpID0+IHIucmVzdGF1cmFudF9pZD09cGFyc2VJbnQoaWQpKS5sZW5ndGg7XG4gICAgICAgLy9jb25zb2xlLmxvZyhudW0pXG4gICAgICAgcmV0dXJuIHJlcy5maWx0ZXIoKHIpID0+IHIucmVzdGF1cmFudF9pZD09cGFyc2VJbnQoaWQpKTtcbiAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiBjb25zb2xlLmxvZyhlcnJvcikpO1xuICAgfVxuXG4gICAvKipcbiAgICAqIFVwZGF0ZSB0aGUgUmV2aWV3IERhdGFiYXNlIGFmdGVyIHBvc3QhXG4gICAgKi9cblxuICAgc3RhdGljIHVwZGF0ZVJldmlld3NEYihyZXZpZXcpIHtcbiAgICAgcmV0dXJuIERCSGVscGVyLm9wZW5SZXZpZXdEYXRhYmFzZSgpLnRoZW4oKGRiKSA9PiB7XG4gICAgICAgbGV0IHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jldmlld3NEYicsICdyZWFkd3JpdGUnKTtcbiAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmV2aWV3c0RiJyk7XG4gICAgICAgLy8gbGV0IHRlbXAgPSByZXZpZXc7XG4gICAgICAgcmV0dXJuIHN0b3JlLmFkZChyZXZpZXcpO1xuICAgICB9KTtcbiAgIH1cblxuICAvKipcbiAgICogQ3JlYXRlIE91dGJveCBkYXRhYmFzZSFcbiAgICovXG5cbiAgICBzdGF0aWMgb3Blbk91dGJveERhdGFiYXNlKCkge1xuICAgICAgcmV0dXJuIGlkYi5vcGVuKCdvdXRib3gnLCAxLCBmdW5jdGlvbih1cGdyYWRlRGIpIHtcbiAgICAgICAgdXBncmFkZURiLmNyZWF0ZU9iamVjdFN0b3JlKCdvdXRib3gnLCB7XG4gICAgICAgIGtleVBhdGg6ICdjcmVhdGVkQXQnfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXZpZXcgU2F2aW5nIG9uIE91dGJveCBEYXRhYmFzZVxuICAgICAqL1xuXG4gICAgc3RhdGljIHNhdmVPdXRib3hEYXRhYmFzZShkYXRhKSB7XG4gICAgICByZXR1cm4gREJIZWxwZXIub3Blbk91dGJveERhdGFiYXNlKCkudGhlbigoZGIpID0+IHtcbiAgICAgICAgaWYgKCFkYikgcmV0dXJuO1xuICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbignb3V0Ym94JywgJ3JlYWR3cml0ZScpO1xuICAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnb3V0Ym94Jyk7XG4gICAgICAvLyAgZGF0YS5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICAgIC8vICAgIHN0b3JlLnB1dChyZXZpZXcpO1xuICAgICAgLy8gIH0pO1xuICAgICAgICBzdG9yZS5wdXQoZGF0YSk7XG4gICAgICAgIHJldHVybiB0eC5jb21wbGV0ZTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqICBDaGVja2luZyByZXZpZXcgYW5kIG9ubGluZSBzdGF0dXMgJiYgc3VibWl0IC0gUGVuZGluZyBhY3Rpb24hIVxuICAgICAqL1xuXG4gICAgc3RhdGljIHBlbmRpbmdGb3JTdWJtaXRSZXZpZXdzKHJldmlld3MpIHtcbiAgICAgIGlmIChuYXZpZ2F0b3Iub25MaW5lICYmIHJldmlld3MubGVuZ3RoPjApIHtcbiAgICAgICAgcmV2aWV3cy5mb3JFYWNoKChyZXZpZXcpID0+IHtcbiAgICAgICAgICBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jldmlld3MvJywge1xuICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXZpZXcpLFxuICAgICAgICAgIH0pLnRoZW4oY2xlYXJPdXRib3goKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFyaW5nIE91dGJveCBEYXRhYmFzZSFcbiAgICAgKi9cblxuICAgIHN0YXRpYyBjbGVhck91dGJveCgpIHtcbiAgICAgIGlmIChuYXZpZ2F0b3Iub25MaW5lKSB7XG4gICAgICByZXR1cm4gREJIZWxwZXIub3Blbk91dGJveERhdGFiYXNlKCkudGhlbigoZGIpID0+e1xuICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbignb3V0Ym94JywgJ3JlYWR3cml0ZScpO1xuICAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgnb3V0Ym94Jyk7XG4gICAgICAgIHN0b3JlLmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0eC5jb21wbGV0ZTtcbiAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogT25saW5lIHN0YXR1cyBjaGVjayAmJiBzdWJtaXQgcGVuZGluZyByZXZpZXdzISFcbiAgICAgKi9cblxuICAgIHN0YXRpYyBwcm9jZXNzQWxsUGVuZGluZ1Jldmlld3MoKSB7XG4gICAgICBpZiAobmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICByZXR1cm4gREJIZWxwZXIub3Blbk91dGJveERhdGFiYXNlKCkudGhlbigoZGIpID0+IHtcbiAgICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbignb3V0Ym94Jyk7XG4gICAgICAgICAgbGV0IHN0b3JlID0gdHgub2JqZWN0U3RvcmUoJ291dGJveCcpO1xuICAgICAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKTtcbiAgICAgICAgfSkudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAvLyBwZW5kaW5nRm9yU3VibWl0UmV2aWV3cyhyZXNwb25zZSk7XG4gICAgICAgICAgcmVzcG9uc2UuZm9yRWFjaChmdW5jdGlvbihyZXZpZXcpIHtcbiAgICAgICAgICAgIC8vY29uc3QgcmV2ID0ge1xuICAgICAgICAgICAgLy8gICdyZXN0YXVyYW50X2lkJzogcmV2aWV3LnJlc3RhdXJhbnRfaWQsXG4gICAgICAgICAgICAvLyAgJ25hbWUnOiByZXZpZXcubmFtZSxcbiAgICAgICAgICAgIC8vICAncmF0aW5nJzogcmV2aWV3LnJhdGluZyxcbiAgICAgICAgICAvLyAgICAnY29tbWVudHMnOiByZXZpZXcuY29tbWVudHMsXG4gICAgICAgICAgICAvLyAgJ2NyZWF0ZWRBdCc6IHJldmlldy5jcmVhdGVkQXRcbiAgICAgICAgICAvLyAgfTtcblxuICAgICAgICAgICAgZmV0Y2goJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXZpZXdzLycsIHtcbiAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJldmlldylcbiAgICAgICAgICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIHNlbGYucmV2aWV3cy5wdXNoKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgLy8gREJIZWxwZXIudXBkYXRlUmV2aWV3c0RiKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgbGV0IGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgICdyZXN0YXVyYW50X2lkJzogcmV2aWV3LnJlc3RhdXJhbnRfaWQsXG4gICAgICAgICAgICAgICAgICAgICduYW1lJzogcmV2aWV3Lm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICdyYXRpbmcnOiByZXZpZXcucmF0aW5nLFxuICAgICAgICAgICAgICAgICAgICAnY29tbWVudHMnOiByZXZpZXcuY29tbWVudHMsXG4gICAgICAgICAgICAgICAgICAgICdjcmVhdGVkQXQnOiByZXZpZXcuY3JlYXRlZEF0LFxuICAgICAgICAgICAgICAgICAgICAnaWQnOiBudW0rMTAwXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIERCSGVscGVyLnVwZGF0ZVJldmlld3NEYihkYXRhKTtcbiAgICAgICAgICAgICAgfSkuY2F0Y2goKGVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXIsIG51bGwpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gIC8qXG4gICogU2F2aW5nIG9uIFJlc3RhdXJhbnRkYXRhYmFzZVxuICAqL1xuICBzdGF0aWMgc2F2ZURhdGFiYXNlKGRhdGEpIHtcbiAgICByZXR1cm4gREJIZWxwZXIub3BlbkRhdGFiYXNlKCkudGhlbihmdW5jdGlvbihkYikge1xuICAgICAgaWYgKCFkYikgcmV0dXJuO1xuICAgICAgbGV0IHR4ID0gZGIudHJhbnNhY3Rpb24oJ3Jlc3RhdXJhbnREYicsICdyZWFkd3JpdGUnKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihyZXN0YXVyYW50KSB7XG4gICAgICAgIHN0b3JlLnB1dChyZXN0YXVyYW50KTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHR4LmNvbXBsZXRlO1xuICAgIH0pO1xuICB9XG5cblxuICAvKlxuICAgKiBVcGRhdGUgZW50cnkgb24gUmVzdGF1cmFudGRhdGFiYXNlICFcbiAgICovXG5cbiAgc3RhdGljIHVwZGF0ZURiKGlkLCB2YWwpIHtcbiAgICByZXR1cm4gREJIZWxwZXIub3BlbkRhdGFiYXNlKCkudGhlbigoZGIpID0+IHtcbiAgICAgIGxldCB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIHJldHVybiBzdG9yZS5nZXQoaWQsICdpc19mYXZvcml0ZScpO1xuICAgIH0pLnRoZW4oKG9iamVjdCkgPT4ge1xuICAgICAgIC8vIElEQiB0ZXN0IHNlYXJjaCBvdXRwdXRcbiAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdCk7XG4gICAgICBvYmplY3QuaXNfZmF2b3JpdGUgPSB2YWw7XG4gICAgICBEQkhlbHBlci5vcGVuRGF0YWJhc2UoKS50aGVuKChkYikgPT4ge1xuICAgICAgICBsZXQgdHggPSBkYi50cmFuc2FjdGlvbigncmVzdGF1cmFudERiJywgJ3JlYWR3cml0ZScpO1xuICAgICAgICBsZXQgc3RvcmUgPSB0eC5vYmplY3RTdG9yZSgncmVzdGF1cmFudERiJyk7XG4gICAgICAgIHN0b3JlLnB1dChvYmplY3QpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gICogR2V0dGluZyBkYXRhIGZyb20gREItUmVzdGF1cmFudGRhdGFiYXNlXG4gICovXG4gIHN0YXRpYyBnZXRDYWNoZWREYigpIHtcbiAgICBkYnByb21pc2UgPSBEQkhlbHBlci5vcGVuRGF0YWJhc2UoKTtcbiAgICByZXR1cm4gZGJwcm9taXNlLnRoZW4oZnVuY3Rpb24oZGIpIHtcbiAgICAgIGlmICghZGIpIHJldHVybjtcbiAgICAgIGxldCB0eCA9IGRiLnRyYW5zYWN0aW9uKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIGxldCBzdG9yZSA9IHR4Lm9iamVjdFN0b3JlKCdyZXN0YXVyYW50RGInKTtcbiAgICAgIHJldHVybiBzdG9yZS5nZXRBbGwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qXG4gICAqIHN0YWdlMlxuICAgKi9cbiAgc3RhdGljIGZyb21BcGkoKSB7XG4gICAgcmV0dXJuIGZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICB9KS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgICBEQkhlbHBlci5zYXZlRGF0YWJhc2UocmVzdGF1cmFudHMpO1xuICAgICAgICByZXR1cm4gcmVzdGF1cmFudHM7XG4gICAgICB9KTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCByZXN0YXVyYW50cy5cbiAgICovXG5cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudHMoY2FsbGJhY2spIHtcbiAgICAvKiogc3RhZ2UxXG4gICAgKmxldCB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAqeGhyLm9wZW4oJ0dFVCcsIERCSGVscGVyLkRBVEFCQVNFX1VSTCk7XG4gICAgKnhoci5vbmxvYWQgPSAoKSA9PiB7XG4gICAgKiAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkgeyAvLyBHb3QgYSBzdWNjZXNzIHJlc3BvbnNlIGZyb20gc2VydmVyIVxuICAgICogICAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgKiAgICBjb25zdCByZXN0YXVyYW50cyA9IGpzb24ucmVzdGF1cmFudHM7XG4gICAgKiAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50cyk7XG4gICAgKiAgfSBlbHNlIHsgLy8gT29wcyEuIEdvdCBhbiBlcnJvciBmcm9tIHNlcnZlci5cbiAgICAqICAgIGNvbnN0IGVycm9yID0gKGBSZXF1ZXN0IGZhaWxlZC4gUmV0dXJuZWQgc3RhdHVzIG9mICR7eGhyLnN0YXR1c31gKTtcbiAgICAqICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAqICB9XG4gICAgKn07XG4gICAgKnhoci5zZW5kKCk7XG4gICAgKiovXG5cbiAgIC8qKiBUZXN0aW5nIGZldGNoIGZyb20gZHVtbXkgc2VydmVyXG4gICAgKmZldGNoKERCSGVscGVyLkRBVEFCQVNFX1VSTClcbiAgICAqICAudGhlbihyZXNwb25kID0+IHtcbiAgICAqICAgIGlmICghcmVzcG9uZC5vayl7XG4gICAgKiAgICAgIHRocm93IFwiVW5hYmxlIHRvIGZldGNoIGZyb20gc2VydmVyIVwiO1xuICAgICogICAgfVxuICAgICogICAgcmV0dXJuIHJlc3BvbmQuanNvbigpO1xuICAgICogIH0pXG4gICAgKiAgLnRoZW4ocmVzdGF1cmFudHMgPT4gY2FsbGJhY2sobnVsbCwgcmVzdGF1cmFudHMpKVxuICAgICogIC5jYXRjaChlID0+IGNhbGxiYWNrKGUsbnVsbCkpXG4gICAgKiovXG5cbiAgICByZXR1cm4gREJIZWxwZXIuZ2V0Q2FjaGVkRGIoKS50aGVuKChyZXN0YXVyYW50cykgPT4ge1xuICAgICAgaWYgKHJlc3RhdXJhbnRzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3RhdXJhbnRzKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gREJIZWxwZXIuZnJvbUFwaSgpO1xuICAgICAgfVxuICAgIH0pLnRoZW4oKHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnRzKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVyKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGVyLCBudWxsKTtcbiAgICAgIH0pO1xuICAgIH1cblxuXG4gIC8qKlxuICAgKiBGZXRjaCBhIHJlc3RhdXJhbnQgYnkgaXRzIElELlxuICAgKi9cblxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgY2FsbGJhY2spIHtcbiAgICAvLyBmZXRjaCBhbGwgcmVzdGF1cmFudHMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXIsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgLy8gIGlmIChlcnJvcikge1xuICAgIC8vICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAvLyAgfVxuICAgIC8vICBlbHNlIHtcbiAgICAgICAgY29uc3QgcmVzdGF1cmFudCA9IHJlc3RhdXJhbnRzLmZpbmQoKHIpID0+IHIuaWQgPT0gaWQpO1xuICAgICAgICBpZiAocmVzdGF1cmFudCkgeyAvLyBHb3QgdGhlIHJlc3RhdXJhbnRcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXN0YXVyYW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHsgLy8gUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgZGF0YWJhc2VcbiAgICAgICAgICBjYWxsYmFjaygnUmVzdGF1cmFudCBkb2VzIG5vdCBleGlzdCcsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCByZXN0YXVyYW50cyBieSBhIGN1aXNpbmUgdHlwZSB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG5cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZShjdWlzaW5lLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50cyAgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmdcbiAgICBEQkhlbHBlci5mZXRjaFJlc3RhdXJhbnRzKChlcnJvciwgcmVzdGF1cmFudHMpID0+IHtcbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBjdWlzaW5lIHR5cGVcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcigocikgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHJlc3RhdXJhbnRzIGJ5IGEgbmVpZ2hib3Job29kIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cblxuICBzdGF0aWMgZmV0Y2hSZXN0YXVyYW50QnlOZWlnaGJvcmhvb2QobmVpZ2hib3Job29kLCBjYWxsYmFjaykge1xuICAgIC8vIEZldGNoIGFsbCByZXN0YXVyYW50c1xuICAgIERCSGVscGVyLmZldGNoUmVzdGF1cmFudHMoKGVycm9yLCByZXN0YXVyYW50cykgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgIH1cbiBlbHNlIHtcbiAgICAgICAgLy8gRmlsdGVyIHJlc3RhdXJhbnRzIHRvIGhhdmUgb25seSBnaXZlbiBuZWlnaGJvcmhvb2RcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IHJlc3RhdXJhbnRzLmZpbHRlcigocikgPT4gci5uZWlnaGJvcmhvb2QgPT0gbmVpZ2hib3Job29kKTtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0cyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggcmVzdGF1cmFudHMgYnkgYSBjdWlzaW5lIGFuZCBhIG5laWdoYm9yaG9vZCB3aXRoIHByb3BlciBlcnJvciBoYW5kbGluZy5cbiAgICovXG5cbiAgc3RhdGljIGZldGNoUmVzdGF1cmFudEJ5Q3Vpc2luZUFuZE5laWdoYm9yaG9vZChjdWlzaW5lLCBuZWlnaGJvcmhvb2QsIGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgfVxuIGVsc2Uge1xuICAgICAgICBsZXQgcmVzdWx0cyA9IHJlc3RhdXJhbnRzO1xuICAgICAgICBpZiAoY3Vpc2luZSAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgY3Vpc2luZVxuICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcigocikgPT4gci5jdWlzaW5lX3R5cGUgPT0gY3Vpc2luZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG5laWdoYm9yaG9vZCAhPSAnYWxsJykgeyAvLyBmaWx0ZXIgYnkgbmVpZ2hib3Job29kXG4gICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHMuZmlsdGVyKChyKSA9PiByLm5laWdoYm9yaG9vZCA9PSBuZWlnaGJvcmhvb2QpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdHMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFsbCBuZWlnaGJvcmhvb2RzIHdpdGggcHJvcGVyIGVycm9yIGhhbmRsaW5nLlxuICAgKi9cblxuICBzdGF0aWMgZmV0Y2hOZWlnaGJvcmhvb2RzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgfVxuIGVsc2Uge1xuICAgICAgICAvLyBHZXQgYWxsIG5laWdoYm9yaG9vZHMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgICAgY29uc3QgbmVpZ2hib3Job29kcyA9IHJlc3RhdXJhbnRzLm1hcCgodiwgaSkgPT4gcmVzdGF1cmFudHNbaV0ubmVpZ2hib3Job29kKTtcbiAgICAgICAgLy8gUmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBuZWlnaGJvcmhvb2RzXG4gICAgICAgIGNvbnN0IHVuaXF1ZU5laWdoYm9yaG9vZHMgPSBuZWlnaGJvcmhvb2RzLmZpbHRlcigodiwgaSkgPT4gbmVpZ2hib3Job29kcy5pbmRleE9mKHYpID09IGkpO1xuICAgICAgICBjYWxsYmFjayhudWxsLCB1bmlxdWVOZWlnaGJvcmhvb2RzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbGwgY3Vpc2luZXMgd2l0aCBwcm9wZXIgZXJyb3IgaGFuZGxpbmcuXG4gICAqL1xuXG4gIHN0YXRpYyBmZXRjaEN1aXNpbmVzKGNhbGxiYWNrKSB7XG4gICAgLy8gRmV0Y2ggYWxsIHJlc3RhdXJhbnRzXG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50cygoZXJyb3IsIHJlc3RhdXJhbnRzKSA9PiB7XG4gICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgY2FsbGJhY2soZXJyb3IsIG51bGwpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIEdldCBhbGwgY3Vpc2luZXMgZnJvbSBhbGwgcmVzdGF1cmFudHNcbiAgICAgICAgY29uc3QgY3Vpc2luZXMgPSByZXN0YXVyYW50cy5tYXAoKHYsIGkpID0+IHJlc3RhdXJhbnRzW2ldLmN1aXNpbmVfdHlwZSk7XG4gICAgICAgIC8vIFJlbW92ZSBkdXBsaWNhdGVzIGZyb20gY3Vpc2luZXNcbiAgICAgICAgY29uc3QgdW5pcXVlQ3Vpc2luZXMgPSBjdWlzaW5lcy5maWx0ZXIoKHYsIGkpID0+IGN1aXNpbmVzLmluZGV4T2YodikgPT0gaSk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHVuaXF1ZUN1aXNpbmVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiAgRmV0Y2ggYWxsIHJldmlld3NcbiAgICovXG5cbiAgIHN0YXRpYyBmZXRjaFJldmlldyhjYWxsYmFjaykge1xuICAgIHJldHVybiBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jldmlld3MnKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgIH0pLnRoZW4oKHJldmlld3MpID0+IHtcbiAgICAgICAgICBjYWxsYmFjayhudWxsLCByZXZpZXdzKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcikgPT4ge1xuICAgICAgICAgIGNhbGxiYWNrKGVyLCBudWxsKTtcbiAgICAgICAgfSk7XG4gICB9XG5cbiAgIC8qKlxuICAgICogRmV0Y2ggcmV2aWV3IGJ5IHJlc3RhdXJhbnQgaWRcbiAgICAqL1xuLypcbiAqIFdpdGhvdXQgQ2FjaGVkICFcbiAqXG4gKiAgICBzdGF0aWMgZmV0Y2hSZXZpZXdCeUlkKGlkLCBjYWxsYmFjaykge1xuICogICAgICByZXR1cm4gZmV0Y2goJ2h0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXZpZXdzLz9yZXN0YXVyYW50X2lkPScrIGlkKVxuICogICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gKiAgICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAqICAgICAgICAgICAgcmVzcG9uc2UuanNvbigpXG4gKiAgICAgICAgICAgIC50aGVuKChqc29uKSA9PiB7XG4gKiAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwganNvbik7XG4gKiAgICAgICAgICAgICAgcmV0dXJuXG4gKiAgICAgICAgICAgIH0pLmNhdGNoKChlcnJvcikgPT4ge1xuICogICAgICAgICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKVxuICogICAgICAgICAgICB9KTtcbiAqICAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgIGNhbGxiYWNrKChgUmVxdWVzdCBmYWlsZWQuIFJldHVybmVkIHN0YXR1cyBvZiAke3Jlc3BvbnNlLnN0YXR1c31gKSwgbnVsbCk7XG4gKiAgICAgICAgICB9XG4gKiAgICAgICAgfVxuICogICAgICApLmNhdGNoKChlcnJvcikgPT4gY2FsbGJhY2soZXJyb3IsIG51bGwpKTtcbiAqICAgIH1cbiAqL1xuICAgIHN0YXRpYyBmZXRjaFJldmlld0J5SWQoaWQsIGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gREJIZWxwZXIucmV2aWV3c0dldENhY2hlZChpZCkudGhlbigocmV2aWV3cykgPT4ge1xuICAgICAgICBpZiAocmV2aWV3cy5sZW5ndGg+MSkge1xuICAgICAgICAgIC8vIGxldCBkYXRhID0gcmV2aWV3cy5maWx0ZXIoKHIpID0+IHIucmVzdGF1cmFudF9pZCA9PSBzZWxmLnJlc3RhdXJhbnQuaWQpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmV2aWV3cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZldGNoKCdodHRwOi8vbG9jYWxob3N0OjEzMzcvcmV2aWV3cy8/cmVzdGF1cmFudF9pZD0nKyBpZClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICB9KS50aGVuKChyZXZpZXdzKSA9PiB7XG4gICAgICAgICAgICAgIERCSGVscGVyLnNhdmVSZXZpZXdzRGF0YWJhc2UocmV2aWV3cyk7XG4gICAgICAgICAgICAgIHJldHVybiByZXZpZXdzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pLnRoZW4oKHJldmlld3MpID0+IHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgcmV2aWV3cyk7XG4gICAgICAgIHJldHVyblxuICAgICAgfSkuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgICAgIH0pO1xuICB9XG5cblxuICAvKipcbiAgICogUG9zdCBSZXZpZXdzXG4gICAqL1xuXG4gICBzdGF0aWMgcG9zdFJldmlld3MocmV2aWV3KSB7XG4gICAgIHJldHVybiBmZXRjaCgnaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jldmlld3MvJywge21ldGhvZDogJ1BPU1QnLCBib2R5OiByZXZpZXd9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gW3t9XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICB9XG5cbiAgIC8qXG4gICAgKiBNYXJrIEZhdm9yaXRlIFJlc3RhdXJhbnRzXG4gICAgKi9cbiAgICBzdGF0aWMgbWFya0Zhdm9yaXRlKHJlc3RhdXJhbnQpIHtcbiAgICAgIGxldCBtYXJrID0gJyc7XG4gICAgICBpZiAoc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlPT09J3RydWUnKSB7XG4gICAgICAgIG1hcmsgPSBgaHR0cDovL2xvY2FsaG9zdDoxMzM3L3Jlc3RhdXJhbnRzLyR7cmVzdGF1cmFudH0vP2lzX2Zhdm9yaXRlPXRydWVgO1xuICAgICAgICBjb25zb2xlLmxvZyhtYXJrKTtcbiAgICAgIH0gZWxzZSBpZiAoc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlPT09J2ZhbHNlJykge1xuICAgICAgICBtYXJrID0gYGh0dHA6Ly9sb2NhbGhvc3Q6MTMzNy9yZXN0YXVyYW50cy8ke3Jlc3RhdXJhbnR9Lz9pc19mYXZvcml0ZT1mYWxzZWA7XG4gICAgICAgIGNvbnNvbGUubG9nKG1hcmspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZmV0Y2gobWFyaywge21ldGhvZDogJ1BVVCd9KVxuICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgcmV0dXJuIFt7fV07XG4gICAgICAgICAgIH1cbiAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgLyoqXG4gICAqIFJlc3RhdXJhbnQgcGFnZSBVUkwuXG4gICAqL1xuXG4gIHN0YXRpYyB1cmxGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQpIHtcbiAgICByZXR1cm4gKGAuL3Jlc3RhdXJhbnQuaHRtbD9pZD0ke3Jlc3RhdXJhbnQuaWR9YCk7XG4gIH1cblxuICAvKipcbiAgICogUmVzdGF1cmFudCBpbWFnZSBVUkwuXG4gICAqL1xuXG4gIHN0YXRpYyBpbWFnZVVybEZvclJlc3RhdXJhbnQocmVzdGF1cmFudCkge1xuICAgIC8vIHJldHVybiAoYC9pbWcvJHtyZXN0YXVyYW50LnBob3RvZ3JhcGh9YFxuLypcbiAgICAgICAgaWYgKE1vZGVybml6ci53ZWJwKSB7XG4gICAgICAgICAgLy8gc3VwcG9ydGVkXG4gICAgICAgICAgcmV0dXJuIChgL2Rpc3QvaW1nLyR7cmVzdGF1cmFudC5waG90b2dyYXBofS53ZWJwYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gbm90LXN1cHBvcnRlZFxuICAgICAgICAgIHJldHVybiAoYC9kaXN0L2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH0uanBnYCk7XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgcmV0dXJuIChgL2ltZy8ke3Jlc3RhdXJhbnQucGhvdG9ncmFwaH0ud2VicGApO1xuICAgIH1cblxuXG4gIC8qKlxuICAgKiBNYXAgbWFya2VyIGZvciBhIHJlc3RhdXJhbnQuXG4gICAqL1xuXG4gIHN0YXRpYyBtYXBNYXJrZXJGb3JSZXN0YXVyYW50KHJlc3RhdXJhbnQsIG1hcCkge1xuICAgIGNvbnN0IG1hcmtlciA9IG5ldyBnb29nbGUubWFwcy5NYXJrZXIoe1xuICAgICAgcG9zaXRpb246IHJlc3RhdXJhbnQubGF0bG5nLFxuICAgICAgdGl0bGU6IHJlc3RhdXJhbnQubmFtZSxcbiAgICAgIHVybDogREJIZWxwZXIudXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KSxcbiAgICAgIG1hcDogbWFwLFxuICAgICAgYW5pbWF0aW9uOiBnb29nbGUubWFwcy5BbmltYXRpb24uRFJPUH1cbiAgICApO1xuICAgIHJldHVybiBtYXJrZXI7XG4gIH1cbn1cbiIsIi8qIGVzbGludCBtYXgtbGVuOiBbXCJlcnJvclwiLCB7IFwiY29kZVwiOiAyMDAgfV0qL1xuLyogZXNsaW50IG5vLXVudXNlZC12YXJzOiBbXCJlcnJvclwiLCB7IFwidmFyc1wiOiBcImxvY2FsXCIgfV0qL1xuXG5cbmxldCByZXN0YXVyYW50O1xubGV0IG1hcDtcblxuLyoqXG4gKiBJbml0aWFsaXplIEdvb2dsZSBtYXAsIGNhbGxlZCBmcm9tIEhUTUwuXG4gKi9cbndpbmRvdy5pbml0TWFwID0gKCkgPT4ge1xuICBmZXRjaFJlc3RhdXJhbnRGcm9tVVJMKChlcnJvciwgcmVzdGF1cmFudCkgPT4ge1xuICAgIGlmIChlcnJvcikgeyAvLyBHb3QgYW4gZXJyb3IhXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZi5tYXAgPSBuZXcgZ29vZ2xlLm1hcHMuTWFwKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKSwge1xuICAgICAgICB6b29tOiAxNixcbiAgICAgICAgY2VudGVyOiByZXN0YXVyYW50LmxhdGxuZyxcbiAgICAgICAgc2Nyb2xsd2hlZWw6IGZhbHNlLFxuICAgICAgfSk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJykuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2FwcGxpY2F0aW9uJyk7XG5cbiAgICAgIGZpbGxCcmVhZGNydW1iKCk7XG5cbiAgICAgIC8qXG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFwJykuc2V0QXR0cmlidXRlKCdyb2xlJywnYXBwbGljYXRpb24nKTtcbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYXAnKS5zZXRBdHRyaWJ1dGUoJ3RhYmluZGV4JywnNCcpO1xuICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hcCcpLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCd0cnVlJyk7XG4gICAgICAqL1xuICAgICAgREJIZWxwZXIubWFwTWFya2VyRm9yUmVzdGF1cmFudChzZWxmLnJlc3RhdXJhbnQsIHNlbGYubWFwKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBHZXQgY3VycmVudCByZXN0YXVyYW50IGZyb20gcGFnZSBVUkwuXG4gKi9cblxuZmV0Y2hSZXN0YXVyYW50RnJvbVVSTCA9IChjYWxsYmFjaykgPT4ge1xuICBpZiAoc2VsZi5yZXN0YXVyYW50KSB7IC8vIHJlc3RhdXJhbnQgYWxyZWFkeSBmZXRjaGVkIVxuICAgIGNhbGxiYWNrKG51bGwsIHNlbGYucmVzdGF1cmFudCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGlkID0gZ2V0UGFyYW1ldGVyQnlOYW1lKCdpZCcpO1xuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJztcbiAgICBjYWxsYmFjayhlcnJvciwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgREJIZWxwZXIuZmV0Y2hSZXN0YXVyYW50QnlJZChpZCwgKGVycm9yLCByZXN0YXVyYW50KSA9PiB7XG4gICAgICBzZWxmLnJlc3RhdXJhbnQgPSByZXN0YXVyYW50O1xuICAgICAgaWYgKCFyZXN0YXVyYW50KSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmaWxsUmVzdGF1cmFudEhUTUwoKTtcbiAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3RhdXJhbnQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IEhUTUwgYW5kIGFkZCBpdCB0byB0aGUgd2VicGFnZVxuICovXG5cbmZpbGxSZXN0YXVyYW50SFRNTCA9IChyZXN0YXVyYW50ID0gc2VsZi5yZXN0YXVyYW50KSA9PiB7XG4gIHNlbGYuaXNfZmF2b3JpdGUgPSByZXN0YXVyYW50LmlzX2Zhdm9yaXRlO1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtbmFtZScpO1xuICBuYW1lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQubmFtZTtcbiAgaWYgKHJlc3RhdXJhbnQuaXNfZmF2b3JpdGU9PT0ndHJ1ZScpIHtcbiAgbmFtZS5pbm5lckhUTUwrPWA8YnV0dG9uIHRhYmluZGV4PVwiMFwiIGFyaWEtbGFiZWw9XCJNYXJrIGFzIHVuZmF2b3JpdGUgcGxhY2VcIiBvbmNsaWNrPVwiZmF2QnV0dG9uKHRoaXMpXCIgY2xhc3M9XCJmYXZvcml0ZVwiPjwvYnV0dG9uPmA7XG4gIH0gZWxzZSB7XG4gICAgbmFtZS5pbm5lckhUTUwrPWA8YnV0dG9uIHRhYmluZGV4PVwiMFwiIGFyaWEtbGFiZWw9XCJNYXJrIGFzIGZhdm9yaXRlIHBsYWNlXCIgb25jbGljaz1cImZhdkJ1dHRvbih0aGlzKVwiIGNsYXNzPVwidW5fZmF2b3JpdGVcIj48L2J1dHRvbj5gO1xuICB9XG4gIGNvbnN0IGFkZHJlc3MgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVzdGF1cmFudC1hZGRyZXNzJyk7XG4gIGFkZHJlc3MuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5hZGRyZXNzO1xuXG4gIGNvbnN0IGltYWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaW1nJyk7XG4gIGltYWdlLmNsYXNzTmFtZSA9ICdyZXN0YXVyYW50LWltZyc7XG4gIC8qIHVuaXF1ZSBhbHQtYXJpYWxhYmVsICovXG4gIGltYWdlLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIG5hbWUuaW5uZXJIVE1MKycgcmVzdGF1cmFudCcpO1xuICBpbWFnZS5zZXRBdHRyaWJ1dGUoJ2FsdCcsIG5hbWUuaW5uZXJIVE1MKycgcmVzdGF1cmFudCcpO1xuXG4gIGltYWdlLnNyYyA9IERCSGVscGVyLmltYWdlVXJsRm9yUmVzdGF1cmFudChyZXN0YXVyYW50KTtcblxuICBjb25zdCBjdWlzaW5lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtY3Vpc2luZScpO1xuICBjdWlzaW5lLmlubmVySFRNTCA9IHJlc3RhdXJhbnQuY3Vpc2luZV90eXBlO1xuXG4gIC8vIGZpbGwgb3BlcmF0aW5nIGhvdXJzXG4gIGlmIChyZXN0YXVyYW50Lm9wZXJhdGluZ19ob3Vycykge1xuICAgIGZpbGxSZXN0YXVyYW50SG91cnNIVE1MKCk7XG4gIH1cbiAgLy8gZmlsbCByZXZpZXdzXG4gIERCSGVscGVyLnByb2Nlc3NBbGxQZW5kaW5nUmV2aWV3cygpO1xuICBEQkhlbHBlci5jbGVhck91dGJveCgpO1xuICBmZXRjaFJldmlld1VybCgpO1xuICAvKlxuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1jb250YWluZXInKTtcbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5pbm5lckhUTUwoJ0FkZCBSZXZpZXcnKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnNldEF0dHJpYnV0ZSgncm9sZScsICdidXR0b24nKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnaWQnLCAnYWRkUmV2aWV3QnV0dG9uJyk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChhZGRSZXZpZXdCdXR0b24pO1xuICAqL1xufTtcblxuXG4vKipcbiAqIENyZWF0ZSByZXN0YXVyYW50IG9wZXJhdGluZyBob3VycyBIVE1MIHRhYmxlIGFuZCBhZGQgaXQgdG8gdGhlIHdlYnBhZ2UuXG4gKi9cblxuZmlsbFJlc3RhdXJhbnRIb3Vyc0hUTUwgPSAob3BlcmF0aW5nSG91cnMgPSBzZWxmLnJlc3RhdXJhbnQub3BlcmF0aW5nX2hvdXJzKSA9PiB7XG4gIGNvbnN0IGhvdXJzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3RhdXJhbnQtaG91cnMnKTtcbiAgZm9yIChsZXQga2V5IGluIG9wZXJhdGluZ0hvdXJzKSB7XG4gICAgY29uc3Qgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndHInKTtcblxuICAgIGNvbnN0IGRheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgZGF5LmlubmVySFRNTCA9IGtleTtcbiAgICBkYXkuc3R5bGUuY29sb3I9JyM1MjUyNTInO1xuICAgIHJvdy5hcHBlbmRDaGlsZChkYXkpO1xuXG4gICAgY29uc3QgdGltZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJyk7XG4gICAgdGltZS5pbm5lckhUTUwgPSBvcGVyYXRpbmdIb3Vyc1trZXldO1xuICAgIHRpbWUuc3R5bGUuY29sb3I9JyM1MjUyNTInO1xuXG4gICAgcm93LmFwcGVuZENoaWxkKHRpbWUpO1xuXG4gICAgaG91cnMuYXBwZW5kQ2hpbGQocm93KTtcbiAgfVxufTtcblxuLyoqXG4gKiBGYXZvcml0ZSBSZXN0YXVyYW50IGJ1dHRvblxuICovXG5cbiBmYXZCdXR0b24gPSAoZWxlbWVudCkgPT4ge1xuICAgaWYgKHNlbGYuaXNfZmF2b3JpdGUgPT09ICd0cnVlJykge1xuICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2Zhdm9yaXRlJyk7XG4gICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZCgndW5fZmF2b3JpdGUnKTtcbiAgICAgc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlPSdmYWxzZSc7XG4gICAgIHNlbGYuaXNfZmF2b3JpdGU9J2ZhbHNlJztcbiAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnTWFyayBhcyBmYXZvcml0ZScpO1xuICAgICAvLyBEQkhlbHBlci5tYXJrRmF2b3JpdGUoc2VsZi5yZXN0YXVyYW50LmlkKTtcbiAgIH0gZWxzZSB7XG4gICAgIHNlbGYucmVzdGF1cmFudC5pc19mYXZvcml0ZSA9ICd0cnVlJztcbiAgICAgc2VsZi5pc19mYXZvcml0ZSA9ICd0cnVlJztcbiAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCAnTWFyayBhcyB1bmZhdm9yaXRlJyk7XG4gICAgIGVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgndW5fZmF2b3JpdGUnKTtcbiAgICAgZWxlbWVudC5jbGFzc0xpc3QuYWRkKCdmYXZvcml0ZScpO1xuICAgIC8vICBEQkhlbHBlci5tYXJrRmF2b3JpdGUoc2VsZi5yZXN0YXVyYW50LmlkKTtcbiAgIH1cbiAgIERCSGVscGVyLm1hcmtGYXZvcml0ZShzZWxmLnJlc3RhdXJhbnQuaWQpO1xuICAgcmV0dXJuIERCSGVscGVyLnVwZGF0ZURiKHNlbGYucmVzdGF1cmFudC5pZCwgc2VsZi5yZXN0YXVyYW50LmlzX2Zhdm9yaXRlKTtcbiB9O1xuXG4vKipcbiAqIENyZWF0ZSBhbGwgcmV2aWV3cyBIVE1MIGFuZCBhZGQgdGhlbSB0byB0aGUgd2VicGFnZS5cbiAqL1xuXG4gZmV0Y2hSZXZpZXdVcmwgPSAoKSA9PiB7XG4gIGlmIChzZWxmLnJldmlldykgeyAvLyByZXN0YXVyYW50IGFscmVhZHkgZmV0Y2hlZCFcbiAgICAvLyBjYWxsYmFjayhudWxsLCBzZWxmLnJlc3RhdXJhbnQpXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaWQgPSBnZXRQYXJhbWV0ZXJCeU5hbWUoJ2lkJyk7XG5cblxuICBpZiAoIWlkKSB7IC8vIG5vIGlkIGZvdW5kIGluIFVSTFxuICAgIGVycm9yID0gJ05vIHJlc3RhdXJhbnQgaWQgaW4gVVJMJ1xuICAgIC8vIGNhbGxiYWNrKGVycm9yLCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBEQkhlbHBlci5mZXRjaFJldmlld0J5SWQoaWQsIChlcnJvciwgcmV2aWV3cykgPT4ge1xuXG4gICAgICBzZWxmLnJldmlld3MgPSByZXZpZXdzO1xuXG4gICAgICBpZiAoIXJldmlld3MpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgIGZpbGxSZXZpZXdzSFRNTChudWxsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZmlsbFJldmlld3NIVE1MKCk7XG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBBZGQgUmV2aWV3IEJ1dHRvbiB3aXRoIHN0eWxlIHNldHRpbmdzXG4gKi9cblxuYWRkUmV2aWV3QnV0dG9uID0gKCkgPT4ge1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1jb250YWluZXInKTtcbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gIGNvbnN0IGFkZFJldmlld0J1dHRvbjIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG5cbiAgYWRkUmV2aWV3QnV0dG9uMi5pbm5lckhUTUwgPSdBZGQgUmV2aWV3JztcbiAgYWRkUmV2aWV3QnV0dG9uLnNldEF0dHJpYnV0ZSgncm9sZScsICdidXR0b24nKTtcbiAgYWRkUmV2aWV3QnV0dG9uLnNldEF0dHJpYnV0ZSgnaWQnLCAnYWRkUmV2aWV3QnV0dG9uJyk7XG4gIGFkZFJldmlld0J1dHRvbi5zZXRBdHRyaWJ1dGUoJ29uY2xpY2snLCAncmV2aWV3Rm9ybSgpJyk7XG4gIGFkZFJldmlld0J1dHRvbjIuc3R5bGUuY29sb3IgPSAnI2ZmZic7XG4gIGFkZFJldmlld0J1dHRvbi5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSAnIzg1NDQwMCc7XG4gIGFkZFJldmlld0J1dHRvbi5zdHlsZS5oZWlnaHQgPSAnMzVweCc7XG4gIGFkZFJldmlld0J1dHRvbi5zdHlsZS53aWR0aCA9ICcxMDBweCc7XG4gIGFkZFJldmlld0J1dHRvbi5zdHlsZS5tYXJnaW4gPSAnMTBweCc7XG4gIGFkZFJldmlld0J1dHRvbi5zdHlsZS5wYWRkaW5nID0gJzEwcHgnO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoYWRkUmV2aWV3QnV0dG9uKTtcbiAgLy8gYWN0aXZhdGUgc3RhdGUgc2V0dGluZ1xuICBhZGRSZXZpZXdCdXR0b24uZGlzYWJsZSA9IGZhbHNlO1xuICBhZGRSZXZpZXdCdXR0b24uaGlkZGVuID0gZmFsc2U7XG4gIC8vIGJvb2ttYXJrIHNldHRpbmchXG4gIGFkZFJldmlld0J1dHRvbjIuc2V0QXR0cmlidXRlKCdocmVmJywgJyNyZXZpZXdGb3JtJyk7XG4gIGFkZFJldmlld0J1dHRvbi5hcHBlbmRDaGlsZChhZGRSZXZpZXdCdXR0b24yKTtcbn1cblxucmV2aWV3Rm9ybSA9ICgpID0+IHtcbiAgY29uc3QgYWRkUmV2aWV3QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZFJldmlld0J1dHRvbicpO1xuICAvLyBkZS1hY3RpdmF0ZSBzdGF0ZSBzZXR0aW5nXG4gIGFkZFJldmlld0J1dHRvbi5kaXNhYmxlID0gdHJ1ZTtcbiAgYWRkUmV2aWV3QnV0dG9uLmhpZGRlbiA9IHRydWU7XG4gIC8vIENyZWF0ZSB0aGUgUmV2aWV3IEZvcm0gd2l0aCBzZXR0aW5nc1xuICBjb25zdCByZXZpZXdGb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xuICByZXZpZXdGb3JtLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAncmV2aWV3X2Zvcm0nKTtcbiAgcmV2aWV3Rm9ybS5pZCA9ICdyZXZpZXdGb3JtJztcbiAgcmV2aWV3Rm9ybS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnZm9ybScpO1xuICByZXZpZXdGb3JtLnNldEF0dHJpYnV0ZSgndGFiaW5kZXgnLCAnMTQnKTtcbiAgcmV2aWV3Rm9ybS5zZXRBdHRyaWJ1dGUoJ29yZGVyJywgJzAnKTtcbiAgY29uc3QgcmV2aWV3c2xpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIHJldmlld3NsaXN0LnNldEF0dHJpYnV0ZSgnb3JkZXInLCAnMScpO1xuICBjb25zdCByZXZpZXdIZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMicpO1xuICByZXZpZXdIZWFkZXIuaW5uZXJIVE1MID0gJ1JldmlldyBGb3JtIGZvcic7XG4gIHJldmlld0hlYWRlci5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnaDInKTtcbiAgcmV2aWV3SGVhZGVyLmlkID0gJ3Jldmlld0hlYWRlcic7XG4gIGNvbnN0IHJldmlld1Jlc3RhdXJhbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICByZXZpZXdSZXN0YXVyYW50LmlubmVySFRNTCA9IHNlbGYucmVzdGF1cmFudC5uYW1lO1xuICByZXZpZXdSZXN0YXVyYW50LnNldEF0dHJpYnV0ZSgncm9sZScsICdoMycpO1xuICByZXZpZXdSZXN0YXVyYW50LmlkID0gJ3Jldmlld1Jlc3RhdXJhbnQnO1xuICBjb25zdCByZXZpZXdOYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgcmV2aWV3TmFtZS5pbm5lckhUTUwgPSAnTmFtZTonO1xuICByZXZpZXdOYW1lLnNldEF0dHJpYnV0ZSgnZm9yJywgJ25hbWUnKTtcbiAgcmV2aWV3TmFtZS5pZCA9ICdyZXZpZXdOYW1lJztcbiAgcmV2aWV3TmFtZS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbGFiZWwnKTtcbiAgY29uc3QgcmV2aWV3SW5wdXROYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgcmV2aWV3SW5wdXROYW1lLmlkID0gJ3Jldmlld0lucHV0TmFtZSc7XG4gIHJldmlld0lucHV0TmFtZS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnaW5wdXQnKTtcbiAgcmV2aWV3SW5wdXROYW1lLnNldEF0dHJpYnV0ZSgnbmFtZScsICduYW1lJyk7XG4gIHJldmlld0lucHV0TmFtZS5zZXRBdHRyaWJ1dGUoJ3BsYWNlaG9sZGVyJywgJ0VudGVyIHlvdXIgTmFtZS4uJyk7XG4gIHJldmlld0lucHV0TmFtZS5zZXRBdHRyaWJ1dGUoJ3JlcXVpcmVkJywgJ3RydWUnKTtcbiAgY29uc3QgcmV2aWV3UmF0aW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgcmV2aWV3UmF0aW5nLmlkID0gJ3Jldmlld1JhdGluZyc7XG4gIHJldmlld1JhdGluZy5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbGFiZWwnKTtcbiAgcmV2aWV3UmF0aW5nLnNldEF0dHJpYnV0ZSgnZm9yJywgJ3JhdGluZycpO1xuICByZXZpZXdSYXRpbmcuaW5uZXJIVE1MID0gJ1JhdGluZzonO1xuICByZXZpZXdSYXRpbmcubWluID0gJzEnO1xuICByZXZpZXdSYXRpbmcubWF4ID0gJzUnO1xuICBjb25zdCByZXZpZXdJbnB1dFJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIHJldmlld0lucHV0UmF0aW5nLmlkID0gJ3Jldmlld0lucHV0UmF0aW5nJztcbiAgcmV2aWV3SW5wdXRSYXRpbmcuc2V0QXR0cmlidXRlKCduYW1lJywgJ3JhdGluZycpO1xuICByZXZpZXdJbnB1dFJhdGluZy5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnaW5wdXQnKTtcbiAgcmV2aWV3SW5wdXRSYXRpbmcuc2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicsICdFbnRlciB5b3VyIFJhdGluZy4uIEZyb20gMSB0byA1LicpO1xuICByZXZpZXdJbnB1dFJhdGluZy5zZXRBdHRyaWJ1dGUoJ3JlcXVpcmVkJywgJ3RydWUnKTtcbiAgY29uc3QgcmV2aWV3Q29tbWVudHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsYWJlbCcpO1xuICByZXZpZXdDb21tZW50cy5pZCA9ICdyZXZpZXdDb21tZW50cyc7XG4gIHJldmlld0NvbW1lbnRzLnNldEF0dHJpYnV0ZSgncm9sZScsICdsYWJlbCcpO1xuICByZXZpZXdDb21tZW50cy5zZXRBdHRyaWJ1dGUoJ2ZvcicsICdjb21tZW50cycpO1xuICByZXZpZXdDb21tZW50cy5pbm5lckhUTUwgPSAnQ29tbWVudHM6JztcbiAgY29uc3QgcmV2aWV3SW5wdXRDb21tZW50cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gIHJldmlld0lucHV0Q29tbWVudHMuaWQgPSAncmV2aWV3SW5wdXRDb21tZW50cyc7XG4gIHJldmlld0lucHV0Q29tbWVudHMuc2V0QXR0cmlidXRlKCdyb2xlJywgJ2lucHV0Jyk7XG4gIHJldmlld0lucHV0Q29tbWVudHMuc2V0QXR0cmlidXRlKCduYW1lJywgJ2NvbW1lbnRzJyk7XG4gIHJldmlld0lucHV0Q29tbWVudHMuc2V0QXR0cmlidXRlKCdwbGFjZWhvbGRlcicsICdFbnRlciB5b3VyIENvbW1lbnRzIGhlcmUuLiBNaW5pbXVtIDkwIGNoYXJhY3RlcnMhJyk7XG4gIHJldmlld0lucHV0Q29tbWVudHMuc2V0QXR0cmlidXRlKCdyZXF1aXJlZCcsICd0cnVlJyk7XG4gIGNvbnN0IHJldmlld1N1Ym1pdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2J1dHRvbicpO1xuICByZXZpZXdTdWJtaXQuaWQgPSAncmV2aWV3U3VibWl0JztcbiAgcmV2aWV3U3VibWl0LnNldEF0dHJpYnV0ZSgncm9sZScsICdidXR0b24nKTtcbiAgcmV2aWV3U3VibWl0LnNldEF0dHJpYnV0ZSgndHlwZScsICdidXR0b24nKTtcbiAgcmV2aWV3U3VibWl0LmlubmVySFRNTCA9ICdTdWJtaXQnO1xuICByZXZpZXdTdWJtaXQuc2V0QXR0cmlidXRlKCdvbmNsaWNrJywgJ2FkZFJldmlldygpJyk7XG4gIC8vIENvbm5lY3QgdGhlIEVsZW1lbnQgd2l0aCBjaGlsZHNcbiAgYWRkQ2hpbGRJbnRvRWxlbWVudChyZXZpZXdGb3JtLCBbcmV2aWV3SGVhZGVyLCByZXZpZXdSZXN0YXVyYW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmlld05hbWUsIHJldmlld0lucHV0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXZpZXdSYXRpbmcsIHJldmlld0lucHV0UmF0aW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmlld0NvbW1lbnRzLCByZXZpZXdJbnB1dENvbW1lbnRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldmlld1N1Ym1pdF0pO1xuICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1jb250YWluZXInKTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJldmlld0Zvcm0pO1xuICAvKipcbiAgICogRm9ybSBTdHlsZXNcbiAgICovXG4gIHJldmlld0Zvcm0uc3R5bGUuaGVpZ2h0ID0gJzQwMHB4JztcbiAgcmV2aWV3Rm9ybS5zdHlsZS5kaXNwbGF5ID0gJ2ZsZXgnO1xuICByZXZpZXdGb3JtLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcbiAgcmV2aWV3SW5wdXRSYXRpbmcuc3R5bGUud2lkdGggPSAnMTUwcHgnO1xuICByZXZpZXdJbnB1dFJhdGluZy5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnNXB4JztcbiAgcmV2aWV3SW5wdXROYW1lLnN0eWxlLndpZHRoID0gJzE1MHB4JztcbiAgcmV2aWV3SW5wdXROYW1lLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICc1cHgnO1xuICByZXZpZXdJbnB1dENvbW1lbnRzLnN0eWxlLmhlaWdodCA9ICcxMDBweCc7XG4gIHJldmlld0lucHV0Q29tbWVudHMuc3R5bGUud2lkdGggPSAnOTAlJztcbiAgcmV2aWV3SW5wdXRDb21tZW50cy5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnNXB4JztcbiAgcmV2aWV3U3VibWl0LnN0eWxlLndpZHRoID0gJzEwMHB4JztcbiAgcmV2aWV3SGVhZGVyLnN0eWxlLm1hcmdpbkJvdHRvbSA9ICcxMHB4JztcbiAgcmV2aWV3UmVzdGF1cmFudC5zdHlsZS5tYXJnaW5Cb3R0b20gPSAnNXB4Jztcbn1cblxuLyoqXG4gKiBGb3JtIFZhbGlkYXRpb24gd2l0aCB0aGUgY29tbWVudCBsaW1pdGF0aW9uIVxuICovXG5cbmNoZWNrVmFsaWRhdGlvbiA9IChjaGVja2xpc3QpID0+IHtcbiAgbGV0IHZhbGlkID0gdHJ1ZTtcblxuICBpZiAoY2hlY2tsaXN0WzBdID09PScnIHx8IChjaGVja2xpc3RbMV0gPDEgfHwgY2hlY2tsaXN0WzFdID41IHx8IGNoZWNrbGlzdFsxXSA9PT0nJykgfHwgKGNoZWNrbGlzdFsyXSA9PT0nJyB8fCBjaGVja2xpc3RbM10gPD0gOTApKSB7XG4gICAgdmFsaWQgPSBmYWxzZTtcbiAgICBsZXQgZXJyb3JNZXNzYWdlID0gJ0Vycm9yISBQbGVhc2UgZmlsbCB0aGUgZW1wdHkgZmllbGQsIG9yIGZpeCB0aGUgdGhlIGludmFsaWQgaW5wdXQhXFxuS2VlcCBpbiBtaW5kIHRoZSBtaW5pbXVtIGNoYXJhY3RlcnMgZm9yIHRoZSBjb21tZW50IGFyZSA5MCEhISc7XG4gICAgY29uc29sZS5sb2coZXJyb3JNZXNzYWdlKTtcbiAgICBhbGVydChlcnJvck1lc3NhZ2UpO1xuICB9XG4gIHJldHVybiB2YWxpZDtcbn1cblxuLyoqXG4gKiBDaGVjaywgUG9zdCwgUmVmcmVzaCEhXG4gKi9cblxuYWRkUmV2aWV3ID0gKCkgPT4ge1xuICBsZXQgcmV2aWV3SW5wdXROYW1lID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld0Zvcm0nKVswXTtcbiAgbGV0IHJldmlld0lucHV0UmF0aW5nID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld0Zvcm0nKVsxXTtcbiAgbGV0IHJldmlld0lucHV0Q29tbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3Rm9ybScpWzJdO1xuICBjb25zdCByZXZpZXcgPSB7XG4gICAgJ3Jlc3RhdXJhbnRfaWQnOiBzZWxmLnJlc3RhdXJhbnQuaWQsXG4gICAgJ25hbWUnOiByZXZpZXdJbnB1dE5hbWUudmFsdWUsXG4gICAgJ3JhdGluZyc6IHJldmlld0lucHV0UmF0aW5nLnZhbHVlLFxuICAgICdjb21tZW50cyc6IHJldmlld0lucHV0Q29tbWVudHMudmFsdWUsXG4gICAgJ2NyZWF0ZWRBdCc6IERhdGUubm93KClcbiAgfTtcbiAgbGlzdGE9W3Jldmlld0lucHV0TmFtZS52YWx1ZSxcbiAgICAgICAgcmV2aWV3SW5wdXRSYXRpbmcudmFsdWUsXG4gICAgICAgIHJldmlld0lucHV0Q29tbWVudHMudmFsdWUsXG4gICAgICAgIHJldmlld0lucHV0Q29tbWVudHMudGV4dExlbmd0aF07XG4gIGlmIChjaGVja1ZhbGlkYXRpb24obGlzdGEpKSB7XG4gICAgaWYgKG5hdmlnYXRvci5vbkxpbmUpIHtcbiAgICBEQkhlbHBlci5wb3N0UmV2aWV3cyhKU09OLnN0cmluZ2lmeShyZXZpZXcpKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgIHNlbGYucmV2aWV3cy5wdXNoKHJlc3VsdCk7XG4gICAgICAvLyBmaWxsUmV2aWV3c0hUTUwoKTtcbiAgICAgIERCSGVscGVyLnVwZGF0ZVJldmlld3NEYihyZXN1bHQpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgICAgICAgfSwgMTAwKTtcbiAgICAgIGFsZXJ0KCdTdGF0dXMgb2YgU3VibWl0ZWQgUmV2aWV3OiBTdWNjZXNzIScpO1xuICAgIH0pLmNhdGNoKChlcnIpID0+IHtcbiAgICAgIHNlbGYucmV2aWV3cy5wdXNoKHJldmlldyk7XG4gICAgLy8gIGZpbGxSZXZpZXdzSFRNTCgpO1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG4gICAgICAgfSwgMTAwMCk7XG4gICAgfSk7XG4gICAgfSBlbHNlIGlmICghbmF2aWdhdG9yLm9uTGluZSkge1xuICAgICAgICBEQkhlbHBlci5zYXZlT3V0Ym94RGF0YWJhc2UocmV2aWV3KTtcbiAgICAgICAgLy9hbGVydCgnV2FybmluZyEhISFcXG5Zb3UgYXJlIG9mZmxpbmUsIHlvdXIgcmV2aWV3IGlzIHNhdmVkIG9uIG91dGJveCFcXG5Zb3VyIHJldmlldyB3aWxsIGJlIGF1dG8tc3VibWl0ZWQgd2hlbiB5b3Ugd2lsbCBiZSBvbmxpbmUgYWdhaW4hJyk7XG4gICAgICAgIC8vc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAvLyAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAvL30sIDEwMDApO1xuICAgICAgIGxldCByZXZGb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jldmlld0Zvcm0nKTtcbiAgICAgICByZXZGb3JtLnJlc2V0KCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29ubmVjdGlvbiBDb25zdHJ1Y3RvciBhcHBlbmRDaGlsZFxuICovXG5cbmFkZENoaWxkSW50b0VsZW1lbnQgPSAoZWxlbWVudCwgY2hpbGRyZW4pID0+IHtcbiAgY2hpbGRyZW4uZm9yRWFjaCgoY2hpbGQpID0+IHtcbiAgICBlbGVtZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgfSk7XG59XG5cbmZpbGxSZXZpZXdzSFRNTCA9IChyZXZpZXdzID0gc2VsZi5yZXZpZXdzKSA9PiB7XG4gIC8qXG4gIGlmICghcmV2aWV3cykge1xuICBEQkhlbHBlci5mZXRjaFJldmlld0J5SWQoc2VsZi5yZXN0YXVyYW50LmlkKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgc2VsZi5yZXZpZXdzID1yZXNwb25zZTtcbiAgICBmaWxsUmV2aWV3c0hUTUwoKTtcbiAgfSk7XG59ICovXG4gIC8vIGxldCBkdXBsaWNhdGVJdGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2gyJylbMV07XG4gIC8vIGxldCBkdXBsaWNhdGVJdGVtMiA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdwJylbM107XG5cbi8vICBpZiAoZHVwbGljYXRlSXRlbSkge1xuLy8gICAgZHVwbGljYXRlSXRlbS5yZW1vdmUoKTtcbiAgICAvLyBkdXBsaWNhdGVJdGVtMi5yZW1vdmUoKTtcbi8vICB9XG4gIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXZpZXdzLWNvbnRhaW5lcicpO1xuICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gyJyk7XG4gIHRpdGxlLmlubmVySFRNTCA9ICdSZXZpZXdzJztcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgLy8gQWRkIFJldmlldyBidXR0b24gIVxuICBhZGRSZXZpZXdCdXR0b24oKTtcbiAgaWYgKCFyZXZpZXdzKSB7XG4gICAgY29uc3Qgbm9SZXZpZXdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICAgIG5vUmV2aWV3cy5pbm5lckhUTUwgPSAnTm8gcmV2aWV3cyB5ZXQhJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQobm9SZXZpZXdzKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgdWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmV2aWV3cy1saXN0Jyk7XG4gIHJldmlld3MuZm9yRWFjaCgocmV2aWV3KSA9PiB7XG4gICAgdWwuYXBwZW5kQ2hpbGQoY3JlYXRlUmV2aWV3SFRNTChyZXZpZXcpKTtcbiAgfSk7XG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh1bCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSByZXZpZXcgSFRNTCBhbmQgYWRkIGl0IHRvIHRoZSB3ZWJwYWdlLlxuICovXG5cbmNyZWF0ZVJldmlld0hUTUwgPSAocmV2aWV3KSA9PiB7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgLyogc2NyZWVuZXIgc2V0dGluZ3MgKi9cbiAgbGkuc2V0QXR0cmlidXRlKCd0YWJpbmRleCcsICcxMycpO1xuICBsaS5zZXRBdHRyaWJ1dGUoJ3JvbGUnLCAnbGlzdGl0ZW0nKTtcbiAgLyogbmFtZSBzZXR0aW5ncyAqL1xuICBjb25zdCBuYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBuYW1lLmlubmVySFRNTCA9IHJldmlldy5uYW1lO1xuICBuYW1lLnN0eWxlLnRleHRBbGlnbj0nbGVmdCc7XG4gIG5hbWUuc3R5bGUud2lkdGg9JzUwJSc7XG4gIG5hbWUuc3R5bGUub3JkZXI9JzAnO1xuICBuYW1lLnN0eWxlLmZvbnRXZWlnaHQ9J2JvbGQnO1xuICBuYW1lLnN0eWxlLmZvbnRTaXplPScxNnB4JztcbiAgbmFtZS5zdHlsZS5jb2xvcj0nIzkzMkMyQSc7XG5cblxuICBsaS5hcHBlbmRDaGlsZChuYW1lKTtcbiAgLyogZGF0ZSBzZXR0aW5ncyAqL1xuICBjb25zdCBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBkYXRlLmlubmVySFRNTCA9IG5ldyBEYXRlKHJldmlldy5jcmVhdGVkQXQpLnRvR01UU3RyaW5nKCk7XG4gIGRhdGUuc3R5bGUudGV4dEFsaWduPSdyaWdodCc7XG4gIGRhdGUuc3R5bGUud2lkdGg9JzUwJSc7XG4gIGRhdGUuc3R5bGUuZm9udFNpemU9JzE2cHgnO1xuICBkYXRlLnN0eWxlLmZvbnRTdHlsZT0nb2JsaXF1ZSc7XG4gIGRhdGUuc3R5bGUudGV4dERlY29yYXRpb249J3VuZGVybGluZSc7XG4gIGRhdGUuc3R5bGUub3JkZXI9JzAnO1xuXG4gIGxpLmFwcGVuZENoaWxkKGRhdGUpO1xuXG4gIGNvbnN0IHJhdGluZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcmF0aW5nLmlubmVySFRNTCA9IGBSYXRpbmc6ICR7cmV2aWV3LnJhdGluZ31gO1xuICAvKiBSYXRpbmcgc2V0dGluZ3MgKi9cbiAgcmF0aW5nLnN0eWxlLmJhY2tncm91bmRDb2xvcj0nIzMzMzMzMyc7XG4gIHJhdGluZy5zdHlsZS5ib3JkZXJSYWRpdXM9JzVweCA1cHgnO1xuICByYXRpbmcuc3R5bGUudGV4dEFsaWduPSdjZW50ZXInO1xuICByYXRpbmcuc3R5bGUuZm9udFdlaWdodD0nYm9sZCc7XG4gIHJhdGluZy5zdHlsZS5mb250U2l6ZT0nMTdweCc7XG4gIHJhdGluZy5zdHlsZS5oZWlnaHQ9JzI1cHgnO1xuICByYXRpbmcuc3R5bGUud2lkdGg9JzEwMHB4JztcbiAgcmF0aW5nLnN0eWxlLmNvbG9yPScjRkZCNTJFJztcbiAgcmF0aW5nLnN0eWxlLm9yZGVyPScxJztcblxuICBsaS5hcHBlbmRDaGlsZChyYXRpbmcpO1xuICAvKiBjb21tZW50IHNldHRpbmdzICovXG4gIGNvbnN0IGNvbW1lbnRzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBjb21tZW50cy5pbm5lckhUTUwgPSByZXZpZXcuY29tbWVudHM7XG4gIGNvbW1lbnRzLnN0eWxlLm9yZGVyPScyJztcbiAgY29tbWVudHMuc3R5bGUubGluZUhlaWdodD0nMS42JztcbiAgY29tbWVudHMuc3R5bGUudGV4dEFsaWduPSdqdXN0aWZ5JztcblxuICBsaS5hcHBlbmRDaGlsZChjb21tZW50cyk7XG5cblxuICByZXR1cm4gbGk7XG59O1xuXG4vKipcbiAqIEFkZCByZXN0YXVyYW50IG5hbWUgdG8gdGhlIGJyZWFkY3J1bWIgbmF2aWdhdGlvbiBtZW51XG4gKi9cblxuZmlsbEJyZWFkY3J1bWIgPSAocmVzdGF1cmFudD1zZWxmLnJlc3RhdXJhbnQpID0+IHtcbiAgY29uc3QgYnJlYWRjcnVtYiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdicmVhZGNydW1iJyk7XG4gIGNvbnN0IGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgbGkuaW5uZXJIVE1MID0gcmVzdGF1cmFudC5uYW1lO1xuICBicmVhZGNydW1iLmFwcGVuZENoaWxkKGxpKTtcbn07XG5cbi8qKlxuICogR2V0IGEgcGFyYW1ldGVyIGJ5IG5hbWUgZnJvbSBwYWdlIFVSTC5cbiAqL1xuXG5nZXRQYXJhbWV0ZXJCeU5hbWUgPSAobmFtZSwgdXJsKSA9PiB7XG4gIGlmICghdXJsKSB7XG51cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbn1cbiAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgJ1xcXFwkJicpO1xuICBjb25zdCByZWdleCA9IG5ldyBSZWdFeHAoYFs/Jl0ke25hbWV9KD0oW14mI10qKXwmfCN8JClgKTtcbiAgY29uc3QgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcbiAgaWYgKCFyZXN1bHRzKSB7XG5yZXR1cm4gbnVsbDtcbn1cbiAgaWYgKCFyZXN1bHRzWzJdKSB7XG5yZXR1cm4gJyc7XG59XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG59O1xuIl19
