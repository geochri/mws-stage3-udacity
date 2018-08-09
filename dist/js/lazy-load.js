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

// Get all of the images that are marked up to lazy load


registerListener('load', setLazy);
registerListener('load', lazyLoad);
registerListener('scroll', lazyLoad);

let lazy = [];

function setLazy() {
    lazy = document.getElementsByClassName('restaurant-img');
    console.log('Found ' + lazy.length + ' lazy images');
}

function lazyLoad() {
    for (let i = 0; i < lazy.length; i++) {
        if (isInViewport(lazy[i])) {
            if (lazy[i].getAttribute('data-src')) {
                lazy[i].src = lazy[i].getAttribute('data-src');
                lazy[i].removeAttribute('data-src');
            }
        }
    }
    cleanLazy();
}

function cleanLazy() {
    lazy = Array.prototype.filter.call(lazy, function (l) {
        return l.getAttribute('data-src');
    });
}

function isInViewport(el) {
    let rect = el.getBoundingClientRect();

    return rect.bottom >= 0 && rect.right >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight) && rect.left <= (window.innerWidth || document.documentElement.clientWidth);
}

function registerListener(event, func) {
    if (window.addEventListener) {
        window.addEventListener(event, func);
    } else {
        window.attachEvent('on' + event, func);
    }
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxhenktbG9hZC5qcyJdLCJuYW1lcyI6WyJyZWdpc3Rlckxpc3RlbmVyIiwic2V0TGF6eSIsImxhenlMb2FkIiwibGF6eSIsImRvY3VtZW50IiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImNvbnNvbGUiLCJsb2ciLCJsZW5ndGgiLCJpIiwiaXNJblZpZXdwb3J0IiwiZ2V0QXR0cmlidXRlIiwic3JjIiwicmVtb3ZlQXR0cmlidXRlIiwiY2xlYW5MYXp5IiwiQXJyYXkiLCJwcm90b3R5cGUiLCJmaWx0ZXIiLCJjYWxsIiwibCIsImVsIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsImJvdHRvbSIsInJpZ2h0IiwidG9wIiwid2luZG93IiwiaW5uZXJIZWlnaHQiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGllbnRIZWlnaHQiLCJsZWZ0IiwiaW5uZXJXaWR0aCIsImNsaWVudFdpZHRoIiwiZXZlbnQiLCJmdW5jIiwiYWRkRXZlbnRMaXN0ZW5lciIsImF0dGFjaEV2ZW50Il0sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7O0FBU0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7OztBQUdBQSxpQkFBaUIsTUFBakIsRUFBeUJDLE9BQXpCO0FBQ0FELGlCQUFpQixNQUFqQixFQUF5QkUsUUFBekI7QUFDQUYsaUJBQWlCLFFBQWpCLEVBQTJCRSxRQUEzQjs7QUFFQSxJQUFJQyxPQUFPLEVBQVg7O0FBRUEsU0FBU0YsT0FBVCxHQUFtQjtBQUNmRSxXQUFPQyxTQUFTQyxzQkFBVCxDQUFnQyxnQkFBaEMsQ0FBUDtBQUNBQyxZQUFRQyxHQUFSLENBQVksV0FBV0osS0FBS0ssTUFBaEIsR0FBeUIsY0FBckM7QUFDSDs7QUFFRCxTQUFTTixRQUFULEdBQW9CO0FBQ2hCLFNBQUksSUFBSU8sSUFBRSxDQUFWLEVBQWFBLElBQUVOLEtBQUtLLE1BQXBCLEVBQTRCQyxHQUE1QixFQUFpQztBQUM3QixZQUFHQyxhQUFhUCxLQUFLTSxDQUFMLENBQWIsQ0FBSCxFQUF5QjtBQUNyQixnQkFBSU4sS0FBS00sQ0FBTCxFQUFRRSxZQUFSLENBQXFCLFVBQXJCLENBQUosRUFBcUM7QUFDakNSLHFCQUFLTSxDQUFMLEVBQVFHLEdBQVIsR0FBY1QsS0FBS00sQ0FBTCxFQUFRRSxZQUFSLENBQXFCLFVBQXJCLENBQWQ7QUFDQVIscUJBQUtNLENBQUwsRUFBUUksZUFBUixDQUF3QixVQUF4QjtBQUNIO0FBQ0o7QUFDSjtBQUNEQztBQUNIOztBQUVELFNBQVNBLFNBQVQsR0FBcUI7QUFDakJYLFdBQU9ZLE1BQU1DLFNBQU4sQ0FBZ0JDLE1BQWhCLENBQXVCQyxJQUF2QixDQUE0QmYsSUFBNUIsRUFBa0MsVUFBU2dCLENBQVQsRUFBVztBQUFFLGVBQU9BLEVBQUVSLFlBQUYsQ0FBZSxVQUFmLENBQVA7QUFBbUMsS0FBbEYsQ0FBUDtBQUNIOztBQUVELFNBQVNELFlBQVQsQ0FBc0JVLEVBQXRCLEVBQTBCO0FBQ3RCLFFBQUlDLE9BQU9ELEdBQUdFLHFCQUFILEVBQVg7O0FBRUEsV0FDSUQsS0FBS0UsTUFBTCxJQUFlLENBQWYsSUFDQUYsS0FBS0csS0FBTCxJQUFjLENBRGQsSUFFQUgsS0FBS0ksR0FBTCxLQUFhQyxPQUFPQyxXQUFQLElBQXNCdkIsU0FBU3dCLGVBQVQsQ0FBeUJDLFlBQTVELENBRkEsSUFHQVIsS0FBS1MsSUFBTCxLQUFjSixPQUFPSyxVQUFQLElBQXFCM0IsU0FBU3dCLGVBQVQsQ0FBeUJJLFdBQTVELENBSko7QUFNSDs7QUFFRCxTQUFTaEMsZ0JBQVQsQ0FBMEJpQyxLQUExQixFQUFpQ0MsSUFBakMsRUFBdUM7QUFDbkMsUUFBSVIsT0FBT1MsZ0JBQVgsRUFBNkI7QUFDekJULGVBQU9TLGdCQUFQLENBQXdCRixLQUF4QixFQUErQkMsSUFBL0I7QUFDSCxLQUZELE1BRU87QUFDSFIsZUFBT1UsV0FBUCxDQUFtQixPQUFPSCxLQUExQixFQUFpQ0MsSUFBakM7QUFDSDtBQUNKIiwiZmlsZSI6ImxhenktbG9hZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludCBcInJlcXVpcmUtanNkb2NcIjogW1wiZXJyb3JcIiwge1xuICAgIFwicmVxdWlyZVwiOiB7XG4gICAgICAgIFwiRnVuY3Rpb25EZWNsYXJhdGlvblwiOiB0cnVlLFxuICAgICAgICBcIk1ldGhvZERlZmluaXRpb25cIjogZmFsc2UsXG4gICAgICAgIFwiQ2xhc3NEZWNsYXJhdGlvblwiOiBmYWxzZSxcbiAgICAgICAgXCJBcnJvd0Z1bmN0aW9uRXhwcmVzc2lvblwiOiBmYWxzZSxcbiAgICAgICAgXCJGdW5jdGlvbkV4cHJlc3Npb25cIjogZmFsc2VcbiAgICB9XG59XSovXG4vKiBlc2xpbnQgdmFsaWQtanNkb2M6IFwiZXJyb3JcIiovXG4vKiBlc2xpbnQgbWF4LWxlbjogW1wiZXJyb3JcIiwgeyBcImNvZGVcIjogMjAwIH1dKi9cbi8qIGVzbGludCBuby11bnVzZWQtdmFyczogW1wiZXJyb3JcIiwgeyBcInZhcnNcIjogXCJsb2NhbFwiIH1dKi9cbi8qIGVzbGludCBicmFjZS1zdHlsZTogWzAseyBcImFsbG93U2luZ2xlTGluZVwiOiB0cnVlIH1dKi9cblxuLy8gR2V0IGFsbCBvZiB0aGUgaW1hZ2VzIHRoYXQgYXJlIG1hcmtlZCB1cCB0byBsYXp5IGxvYWRcblxuXG5yZWdpc3Rlckxpc3RlbmVyKCdsb2FkJywgc2V0TGF6eSk7XG5yZWdpc3Rlckxpc3RlbmVyKCdsb2FkJywgbGF6eUxvYWQpO1xucmVnaXN0ZXJMaXN0ZW5lcignc2Nyb2xsJywgbGF6eUxvYWQpO1xuXG5sZXQgbGF6eSA9IFtdO1xuXG5mdW5jdGlvbiBzZXRMYXp5KCkge1xuICAgIGxhenkgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdyZXN0YXVyYW50LWltZycpO1xuICAgIGNvbnNvbGUubG9nKCdGb3VuZCAnICsgbGF6eS5sZW5ndGggKyAnIGxhenkgaW1hZ2VzJyk7XG59XG5cbmZ1bmN0aW9uIGxhenlMb2FkKCkge1xuICAgIGZvcihsZXQgaT0wOyBpPGxhenkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYoaXNJblZpZXdwb3J0KGxhenlbaV0pKXtcbiAgICAgICAgICAgIGlmIChsYXp5W2ldLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKSl7XG4gICAgICAgICAgICAgICAgbGF6eVtpXS5zcmMgPSBsYXp5W2ldLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcbiAgICAgICAgICAgICAgICBsYXp5W2ldLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBjbGVhbkxhenkoKTtcbn1cblxuZnVuY3Rpb24gY2xlYW5MYXp5KCkge1xuICAgIGxhenkgPSBBcnJheS5wcm90b3R5cGUuZmlsdGVyLmNhbGwobGF6eSwgZnVuY3Rpb24obCl7IHJldHVybiBsLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKTt9KTtcbn1cblxuZnVuY3Rpb24gaXNJblZpZXdwb3J0KGVsKSB7XG4gICAgbGV0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIHJlY3QuYm90dG9tID49IDAgJiZcbiAgICAgICAgcmVjdC5yaWdodCA+PSAwICYmXG4gICAgICAgIHJlY3QudG9wIDw9ICh3aW5kb3cuaW5uZXJIZWlnaHQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCkgJiZcbiAgICAgICAgcmVjdC5sZWZ0IDw9ICh3aW5kb3cuaW5uZXJXaWR0aCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGgpXG4gICAgICk7XG59XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTGlzdGVuZXIoZXZlbnQsIGZ1bmMpIHtcbiAgICBpZiAod2luZG93LmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmMpXG4gICAgfSBlbHNlIHtcbiAgICAgICAgd2luZG93LmF0dGFjaEV2ZW50KCdvbicgKyBldmVudCwgZnVuYylcbiAgICB9XG59XG4iXX0=
