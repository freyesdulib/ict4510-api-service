/**
 * fernando.reyes@du.edu
 * ICT4510 final project example
 * Contact page module
 */

'use strict';

const contactModule = (function () {

    'use strict';

    let obj = {};

    /**
     * Gets map
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
    const process_contact_form = function (menu) {
        // TODO...
    };

    obj.init = function () {
        get_map();
    };

    return obj;

}());

// init function calls get_menu_items() function when the page loads
contactModule.init();