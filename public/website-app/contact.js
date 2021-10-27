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
 * Contact page module
 */

'use strict';

const contactModule = (function () {

    let obj = {};

    /**
     * Creates map using leafjs library
     */
    const get_map = function () {

        const LAT = 39.678380;
        const LONG = -104.961753;

        let mymap = L.map('map').setView([LAT, LONG], 13);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmVybmFuZG8tcmV5ZXMiLCJhIjoiY2p0ajY0NDN2MHNkeTN5cDUzczJrZzc4MCJ9.hUSeWuhT2aXnGdbowhXFqA', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'your.mapbox.access.token'
        }).addTo(mymap);

        L.marker([LAT, LONG]).addTo(mymap).bindPopup("University of Denver | ICT4510");
        L.popup();
    };

    /**
     * Renders repository stats on home page
     * @param menu
     */
    const process_contact_form_data = function () {

        document.querySelector('#message').innerHTML = `<strong>Thank you, ${document.querySelector('#contact_name').value}!</strong>`;

        setTimeout(function() {
            document.querySelector('.tm-contact-form').reset();
            document.querySelector('#message').innerHTML = '';
        }, 5000);
    };

    obj.init = function () {
        document.querySelector('#send-message-button').addEventListener('click', function() {
            process_contact_form_data();
        });
        get_map();
    };

    return obj;

}());

// init function calls get_map() function when the page loads
contactModule.init();