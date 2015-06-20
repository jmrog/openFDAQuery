(function($) {
    $(function() { // begin `document.ready` handler

        // begin click handler for data-set radio buttons
        $('#data-set-fieldset').on('click', 'input[name="data-set"]', function() {
            var el = $(this);

            el.closest('fieldset')
                .find('div.sub-data-set').addClass('hidden').end()
                .find('div.sub-data-set').has('input[name="sub-data-' + el.val() + '"]').removeClass('hidden');

            $('#data-set-choice').text(el.val() + 's');
        }); // end click handler for data-set radio buttons

        // begin "Add Search Item" button click handler
        $('#search-item-fieldset').on('click', 'button#add-search-term', function() {
            var searchItemClone = $('div.search-item').last().clone(),
                spanSearchItemNum = searchItemClone.find('span.search-item-num');
                numSearchItems = parseInt(spanSearchItemNum.text(), 10),
                searchItemNum = numSearchItems + 1;

            // Increment the values for id/name attributes on the clone elements
            searchItemClone.find('[id*="-' + numSearchItems + '"]').each(function() {
                var el = $(this);
                el.prop('id', el.prop('id').replace('-' + numSearchItems, '-' + searchItemNum));
                if (el.is('input')) {
                    el.prop('name', el.prop('name').replace('-' + numSearchItems, '-' + searchItemNum));
                }
            });

            spanSearchItemNum.text(searchItemNum);
            searchItemClone.find('input').val('');
            searchItemClone.insertBefore('button#add-search-term');
        }); // end "Add Search Item" button click handler

        // begin click handler for "Toggle Instructions" link
        $('#instructions-toggle').on('click', function(evt) {
            var instructionsDiv = $('#search-instructions');

            evt.preventDefault();
            evt.stopPropagation();

            instructionsDiv.toggleClass('hidden');
            $(this).text(instructionsDiv.hasClass('hidden') ? 'Show Search Instructions' : 'Hide Search Instructions');
        });

        // begin "Submit" click handler
        $('#query-form').on('submit', function(evt) {
            var dataSet, subDataSet, searchItems, fullSearch, baseURL, apiKey, limit;
            var el = $(this);

            evt.preventDefault();
            evt.stopPropagation();

            $('#results').find('pre').text('');

            apiKey = 'MzPnC5U3ET5CKXrmWrfBxh7YSIhSmZVw2Ao2upAq';
            dataSet = el.find('input[name="data-set"]:checked').val();
            subDataSet = el.find('input[name="sub-data-' + dataSet + '"]:checked').val();

            // construct array of searchItems as objects with `field` and `term` properties
            // Right now, this seems easier than parsing a serialized string of form data, but that may
            // change as things become more complicated.
            searchItems = $('div.search-item').filter(function() {
                // ignore search items with no term values
                return $(this).find('input[name^="search-term"]').val().trim();
            })
            .map(function() {
                var el = $(this),
                    field = el.find('input[name^="search-field"]').val().trim(),
                    term = el.find('input[name^="search-term"]').val().trim().replace(/ +/g, '+');

                return {
                    field: field,
                    term: term
                };
            }).get();

            if (!searchItems.length) {
                return $('#results').find('pre').text('Please specify at least one search term.');
            }

            fullSearch = searchItems.reduce(function(searchString, item, idx) {
                if (item.field) {
                    searchString += item.field + ':';
                }
                if (item.term) {
                    searchString += '"' + item.term + '"';
                }
                if (idx < (searchItems.length - 1)) {
                    // There are additional search items coming
                    searchString += '+AND+';
                }
                return searchString;
            }, '');

            limit = parseInt($('input[name="limit"]').val(), 10) || 25;

            baseURL = 'https://api.fda.gov/' + dataSet + '/' + subDataSet + '.json?api_key=' + apiKey +
                      '&limit=' + limit + '&search=';

            $.getJSON(baseURL + fullSearch)
                .done(function(data) {
                    $('#results').find('pre').text(JSON.stringify(data, null, 4));
                })
                .fail(function(xhr, msg, error) {
                    if (xhr.status === 404) {
                        $('#results').find('pre').text('No results found that match your criteria.');
                    } else {
                        console.error(msg + ': ' + error);
                        $('#results').find('pre').text('Search failed. See the console for details, and/or check your search terms and try again.');
                    }
                });
        }); // end "Submit" click handler

    }); // end of `document.ready` handler
})(jQuery);
