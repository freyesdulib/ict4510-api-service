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
 * Dashboard page module
 */

'use strict';

const dashboardModule = (function () {

    'use strict';

    const User = JSON.parse(window.localStorage.getItem('user'));

    if (User === null) {
        logout();
    }

    const MENU_ENDPOINT = `${configModule.get_api_url()}api/menus?api_key=${User.user.api_key}`;

    let obj = {};

    const display_profile_info = function () {

        let images = ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png'];
        let index = Math.floor(Math.random() * (images.length));

        if (index === 0) {
            index = index + 1;
        }

        document.querySelector('#user-image').src = `admin-assets/img/${images[index]}`;
        document.querySelector('#profile-user').innerHTML = `${User.user.first_name} ${User.user.last_name} `;
        document.querySelector('#profile-username').innerHTML = `Username: ${User.user.username}`;
        document.querySelector('#profile-api-key').innerHTML = `API KEY: ${User.user.api_key}`;
    };

    const get_menu_items = function () {

        const URL = `${MENU_ENDPOINT}`;

        fetch(URL)
            .then(function (response) {

                if (response.status === 200) {
                    return response.json();
                }

            })
            .then(function (json) {
                display_menu_items(json.menu);
            });
    };

    const display_menu_items = function (menu) {

        if (menu.length === 0) {
            document.querySelector('#menu').innerHTML = '<div class="alert alert-info"><small>Sorry!, no daily menu today.</small></div>';
            return false;
        }

        let html = '';

        for (let i = 0;i<menu.length;i++) {
            html += `<tr>
            <td><a href="#" onclick="dashboardModule.edit_menu_item(${menu[i].id})"><i class="fa fa-edit"></i></a> </td>
            <td>${menu[i].item}</td>
            <td>${menu[i].description}</td>
            <td>${menu[i].price}</td>
            </tr>`;
        }

        document.querySelector('#menu-items').innerHTML = html;
    };

    const save_menu_item = function () {

        let token = User.user.token;
        let url = `${MENU_ENDPOINT}`;

        let item = {
            item: document.querySelector('#item').value.trim(),
            description: document.querySelector('#description').value.trim(),
            price: document.querySelector('#price').value.trim()
        };

        let request = new Request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(item),
            mode: 'cors'
        });

        fetch(request)
            .then(function(response) {

                if (response.status === 201) {

                    // clear form fields
                    document.querySelector('#item').value = '';
                    document.querySelector('#description').value = '';
                    document.querySelector('#price').value = '';
                    document.querySelector('#message').innerHTML = '<div class="alert alert-success">Menu Item Saved!</div>';
                    get_menu_items();

                    setTimeout(function () {
                        let message = document.querySelector('#message').innerHTML = '';
                    }, 3000);

                } else if (response.status === 400) {

                    response.json().then(function (response) {

                        let errors = '<ul>';

                        for (let i=0;i<response.errors.length;i++) {
                            errors += '<li>' + response.errors[i].message + '</li>';
                        }

                        errors += '</ul>';

                        document.querySelector('#message').innerHTML = '<div class="alert alert-danger">' + errors + '</div>';

                        setTimeout(function () {
                            document.querySelector('#message').innerHTML = '';
                        }, 7000);

                    });

                } else {

                    document.querySelector('#message').innerHTML = '<div class="alert alert-danger">Menu Item NOT Saved</div>';

                    setTimeout(function () {
                        document.querySelector('#message').innerHTML = '';
                    }, 3000);
                }
            });
    };

    const get_menu_item = function (id, callback) {

        const URL = `${MENU_ENDPOINT}&id=${id}`;

        fetch(URL)
            .then(function (response) {

                if (response.status === 200) {
                    return response.json();
                }

            })
            .then(function (json) {
                callback(json.menu);
            });
    };

    obj.edit_menu_item = function (id) {

        get_menu_item(id, function(json) {

            document.querySelector('#form-mode').innerHTML = 'Edit Menu Item';
            document.querySelector('#toggle-delete-button').style.visibility = 'visible';

            let item_values = json.pop();
            // place values in form input fields
            document.querySelector('#item-id').value = item_values.id;
            document.querySelector('#item').value = item_values.item;
            document.querySelector('#description').value = item_values.description;
            document.querySelector('#price').value = item_values.price;
            attach_onclick_update();
            attach_onclick_delete();

        });
    };

    const update_menu_item = function () {

        let token = User.user.token;
        let url = `${MENU_ENDPOINT}`;

        let item = {
            id: document.querySelector('#item-id').value.trim(),
            item: document.querySelector('#item').value.trim(),
            description: document.querySelector('#description').value.trim(),
            price: document.querySelector('#price').value.trim()
        };

        let request = new Request(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(item),
            mode: 'cors'
        });

        fetch(request)
            .then(function(response) {

                if (response.status === 204) {

                    document.querySelector('#form-mode').innerHTML = 'Add Menu Item';
                    document.querySelector('#toggle-delete-button').style.visibility = 'hidden';
                    attach_onclick_save();

                    // clear form fields
                    document.querySelector('#item').value = '';
                    document.querySelector('#description').value = '';
                    document.querySelector('#price').value = '';
                    document.querySelector('#message').innerHTML = '<div class="alert alert-success">Menu Item Updated!</div>';

                    get_menu_items();

                    setTimeout(function () {
                        let message = document.querySelector('#message').innerHTML = '';
                    }, 3000);

                } else if (response.status === 400) {

                    response.json().then(function (response) {

                        let errors = '<ul>';

                        for (let i=0;i<response.errors.length;i++) {
                            errors += '<li>' + response.errors[i].message + '</li>';
                        }

                        errors += '</ul>';

                        document.querySelector('#message').innerHTML = '<div class="alert alert-danger">' + errors + '</div>';

                        setTimeout(function () {
                            document.querySelector('#message').innerHTML = '';
                        }, 7000);

                    });

                } else {

                    document.querySelector('#message').innerHTML = '<div class="alert alert-danger">Menu Item NOT Saved</div>';

                    setTimeout(function () {
                        document.querySelector('#message').innerHTML = '';
                    }, 3000);
                }
            });
    };

    const delete_menu_item = function () {

        let token = User.user.token;
        let url = `${MENU_ENDPOINT}`;

        let item = {
            id: document.querySelector('#item-id').value.trim()
        };

        let request = new Request(`${url}&id=${item.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(item),
            mode: 'cors'
        });

        fetch(request)
            .then(function(response) {

                if (response.status === 204) {

                    document.querySelector('#form-mode').innerHTML = 'Add Menu Item';
                    attach_onclick_save();

                    // clear form fields
                    document.querySelector('#item').value = '';
                    document.querySelector('#description').value = '';
                    document.querySelector('#price').value = '';
                    document.querySelector('#message').innerHTML = '<div class="alert alert-success">Menu Item Deleted!</div>';

                    get_menu_items();

                    setTimeout(function () {
                        let message = document.querySelector('#message').innerHTML = '';
                    }, 3000);

                } else if (response.status === 400) {

                    response.json().then(function (response) {

                        let errors = '<ul>';

                        for (let i=0;i<response.errors.length;i++) {
                            errors += '<li>' + response.errors[i].message + '</li>';
                        }

                        errors += '</ul>';

                        document.querySelector('#message').innerHTML = '<div class="alert alert-danger">' + errors + '</div>';

                        setTimeout(function () {
                            document.querySelector('#message').innerHTML = '';
                        }, 7000);

                    });

                } else {

                    document.querySelector('#message').innerHTML = '<div class="alert alert-danger">Menu Item NOT Deleted</div>';

                    setTimeout(function () {
                        document.querySelector('#message').innerHTML = '';
                    }, 3000);
                }
            });
    };

    function attach_save() {
        save_menu_item();
    }

    function attach_update() {
        update_menu_item();
    }

    function attach_delete() {
        delete_menu_item();
    }

    function logout () {
        // clear local storage
        window.localStorage.removeItem('user');
        // redirect user to login page
        window.location.replace('/login');
    }

    const attach_onclick_save = function() {
        document.querySelector('#save-menu-item-button').removeEventListener('click', attach_update, false);
        document.querySelector('#save-menu-item-button').addEventListener('click', attach_save);
    };

    const attach_onclick_update = function () {
        document.querySelector('#save-menu-item-button').removeEventListener('click', attach_save, false);
        document.querySelector('#save-menu-item-button').addEventListener('click', attach_update);
    };

    const attach_onclick_delete = function () {
        document.querySelector('#delete-menu-item-button').addEventListener('click', attach_delete);
    };

    const attach_onclick_logout = function () {
        document.querySelector('#logout-link').addEventListener('click', logout);
    };

    obj.init = function () {

        let profile_exists = window.localStorage.getItem('user');

        if (profile_exists === null) {
            logout();
        } else {
            display_profile_info();
            get_menu_items();
            attach_onclick_save();
            attach_onclick_logout();
            document.querySelector('#toggle-delete-button').style.visibility = 'hidden';
        }
    };

    return obj;

}());

// init function calls get_menu_items() function when the page loads
dashboardModule.init();