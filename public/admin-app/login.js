/**
 * fernando.reyes@du.edu
 * ICT4510 final project example
 * Login page module
 */

'use strict';

const loginModule = (function () {

    'use strict';

    const URL = get_api_url() + 'api/login';
    let obj = {};

    const authenticate = function () {

        document.querySelector('#message').innerHTML = '<div class="alert alert-info">Authenticating...</div>';

        let User = {
            username: document.querySelector('#username').value.trim(),
            password: document.querySelector('#password').value.trim()
        };

        let request = new Request(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(User),
            mode: 'cors'
        });

        fetch(request)
            .then(function(response) {

                if (response.status === 200) {

                   // hide form
                    document.querySelector('.card').style.display = 'none';
                    // clear form fields
                    document.querySelector('#username').value = '';
                    document.querySelector('#password').value = '';
                    return response.json();

                } else {
                    document.querySelector('#message').innerHTML = '<div class="alert alert-danger">Authentication failed</div>';
                    return false;
                }
            })
            .then(function (json) {

                if (json !== false) {
                    window.localStorage.setItem('user', JSON.stringify(json));
                    setTimeout(function() {
                        window.location.href = '/dashboard';
                    }, 2000);
                }
            });

        return false;
    };

    obj.init = function () {
        window.localStorage.removeItem('user');
        // bind click event to login button (HTML button had id login-button)
        document.querySelector('#login-button').addEventListener('click', function() {
            authenticate();
        });


    };

    return obj;

}());

// init function attached onclick event handler to login button when the page loads
loginModule.init();