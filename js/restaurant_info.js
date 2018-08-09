/* eslint max-len: ["error", { "code": 200 }]*/
/* eslint no-unused-vars: ["error", { "vars": "local" }]*/


let restaurant;
let map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false,
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

fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
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
  if (restaurant.is_favorite==='true') {
  name.innerHTML+=`<button tabindex="0" aria-label="Mark as unfavorite place" onclick="favButton(this)" class="favorite"></button>`;
  } else {
    name.innerHTML+=`<button tabindex="0" aria-label="Mark as favorite place" onclick="favButton(this)" class="un_favorite"></button>`;
  }
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  /* unique alt-arialabel */
  image.setAttribute('aria-label', name.innerHTML+' restaurant');
  image.setAttribute('alt', name.innerHTML+' restaurant');

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
    day.style.color='#525252';
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    time.style.color='#525252';

    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Favorite Restaurant button
 */

 favButton = (element) => {
   if (self.is_favorite === 'true') {
     element.classList.remove('favorite');
     element.classList.add('un_favorite');
     self.restaurant.is_favorite='false';
     self.is_favorite='false';
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
  if (self.review) { // restaurant already fetched!
    // callback(null, self.restaurant)
    return;
  }

  const id = getParameterByName('id');


  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
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
    })
  }
}

/**
 * Create Add Review Button with style settings
 */

addReviewButton = () => {
  const container = document.getElementById('reviews-container');
  const addReviewButton = document.createElement('button');
  const addReviewButton2 = document.createElement('a');

  addReviewButton2.innerHTML ='Add Review';
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
}

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
  addChildIntoElement(reviewForm, [reviewHeader, reviewRestaurant,
                                  reviewName, reviewInputName,
                                  reviewRating, reviewInputRating,
                                  reviewComments, reviewInputComments,
                                  reviewSubmit]);
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
}

/**
 * Form Validation with the comment limitation!
 */

checkValidation = (checklist) => {
  let valid = true;

  if (checklist[0] ==='' || (checklist[1] <1 || checklist[1] >5 || checklist[1] ==='') || (checklist[2] ==='' || checklist[3] <= 90)) {
    valid = false;
    let errorMessage = 'Error! Please fill the empty field, or fix the the invalid input!\nKeep in mind the minimum characters for the comment are 90!!!';
    console.log(errorMessage);
    alert(errorMessage);
  }
  return valid;
}

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
  lista=[reviewInputName.value,
        reviewInputRating.value,
        reviewInputComments.value,
        reviewInputComments.textLength];
  if (checkValidation(lista)) {
    if (navigator.onLine) {
    DBHelper.postReviews(JSON.stringify(review)).then((result) => {
      self.reviews.push(result);
      // fillReviewsHTML();
      DBHelper.updateReviewsDb(result);
      setTimeout(() => {
               window.location.reload();
             }, 100);
      alert('Status of Submited Review: Success!');
    }).catch((err) => {
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
}

/**
 * Connection Constructor appendChild
 */

addChildIntoElement = (element, children) => {
  children.forEach((child) => {
    element.appendChild(child);
  });
}

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
  reviews.forEach((review) => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */

createReviewHTML = (review) => {
  const li = document.createElement('li');
  /* screener settings */
  li.setAttribute('tabindex', '13');
  li.setAttribute('role', 'listitem');
  /* name settings */
  const name = document.createElement('p');
  name.innerHTML = review.name;
  name.style.textAlign='left';
  name.style.width='50%';
  name.style.order='0';
  name.style.fontWeight='bold';
  name.style.fontSize='16px';
  name.style.color='#932C2A';


  li.appendChild(name);
  /* date settings */
  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toGMTString();
  date.style.textAlign='right';
  date.style.width='50%';
  date.style.fontSize='16px';
  date.style.fontStyle='oblique';
  date.style.textDecoration='underline';
  date.style.order='0';

  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  /* Rating settings */
  rating.style.backgroundColor='#333333';
  rating.style.borderRadius='5px 5px';
  rating.style.textAlign='center';
  rating.style.fontWeight='bold';
  rating.style.fontSize='17px';
  rating.style.height='25px';
  rating.style.width='100px';
  rating.style.color='#FFB52E';
  rating.style.order='1';

  li.appendChild(rating);
  /* comment settings */
  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.style.order='2';
  comments.style.lineHeight='1.6';
  comments.style.textAlign='justify';

  li.appendChild(comments);


  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */

fillBreadcrumb = (restaurant=self.restaurant) => {
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
