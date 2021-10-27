/**
 Copyright 2021 fernando.reyes@du.edu

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * ICT4510 final project example
 * Login page module
 */

'use strict';

const loginModule = (function () {

    'use strict';

    const URL = configModule.get_api_url() + 'api/login';
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