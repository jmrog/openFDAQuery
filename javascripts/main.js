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
            var searchItemClone = $('div.search-item').first().clone(),
                spanSearchItemNum = $('div.search-item').last().find('span.search-item-num');
                numSearchItems = parseInt(spanSearchItemNum.text(), 10),
                searchItemNum = numSearchItems + 1,
                joiningTermsTemplate = '<span>Join searches with... ' +
                        '<label><input type="radio" name="joining-term-' + numSearchItems + '" value="AND" checked="checked" /> AND</label>' +
                        '&nbsp;<label><input type="radio" name="joining-term-' + numSearchItems + '" value="OR" /> OR</label></span>';

            // Increment the values for id/name attributes on the clone elements
            searchItemClone.find('[id*="-1"],[name*="-1"]').each(function() {
                var el = $(this);
                if (el.is('input')) {
                    el.prop('name', el.prop('name').replace('-1', '-' + searchItemNum));
                } else {
                    el.prop('id', el.prop('id').replace('-1', '-' + searchItemNum));
                }
            });

            searchItemClone.find('span.search-item-num').text(searchItemNum);
            searchItemClone.find('input[type="text"]').val('');
            searchItemClone.prepend($('<div>').prop('class', 'joining-terms').html(joiningTermsTemplate));
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
            var dataSet, subDataSet, searchItems, fullSearch, baseURL, apiKey, limit, skip;
            var el = $(this);

            evt.preventDefault();
            evt.stopPropagation();

            $('#results').find('pre').text('');

            apiKey = 'MzPnC5U3ET5CKXrmWrfBxh7YSIhSmZVw2Ao2upAq';
            dataSet = el.find('input[name="data-set"]:checked').val();
            subDataSet = el.find('input[name="sub-data-' + dataSet + '"]:checked').val();
            limit = parseInt($('input[name="limit"]').val(), 10) || 25;
            skip = parseInt($('input[name="skip"]').val(), 10) || 0;
            baseURL = 'https://api.fda.gov/' + dataSet + '/' + subDataSet + '.json?api_key=' + apiKey +
                      '&limit=' + limit + '&skip=' + skip + '&search=';

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
                var joiningTerm = '',
                    exactMatch = (el.find('input[name="exact-match-' + (idx + 1) + '"]:checked').val() === 'yes' &&
                                  !/^\[.*\]$/.test(item.term));

                if (item.field) {
                    searchString += item.field + ':';
                }
                if (item.term) {
                    searchString += exactMatch ? '"' + item.term + '"' : item.term;
                }
                if (idx < (searchItems.length - 1)) {
                    // There are additional search items coming
                    joiningTerm = el.find('input[name="joining-term-' + (idx + 1) + '"]:checked').val();
                    searchString += joiningTerm === 'AND' ? '+AND+' : '+';
                }
                return searchString;
            }, '');

            $('.loading').removeClass('hidden');
            $.getJSON(baseURL + fullSearch)
                .done(function(data) {
                    $('.loading').addClass('hidden');
                    $('#results').find('pre').text(JSON.stringify(data, null, 4));
                })
                .fail(function(xhr, msg, error) {
                    $('.loading').addClass('hidden');
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
