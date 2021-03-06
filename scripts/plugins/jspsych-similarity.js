/** 
 * jspsych-similarity.js
 * Josh de Leeuw
 * 
 * This plugin create a trial where two images are shown sequentially, and the subject rates their similarity using a slider controlled with the mouse.
 *
 * parameters:
 *      stimuli:            array of arrays. inner arrays are two stimuli. stimuli can be image paths or html strings. each inner array is one trial.
 *      labels:             array of strings to label the slider with. labels will be evenly spaced along the slider.
 *      intervals:          how many different response options are on the slider
 *      show_ticks:         if true, then the slider will have small tick marks displayed to show where the response options are.
 *      show_response:      determines when to show the response options: "FIRST_STIMULUS","SECOND_STIMULUS",or "POST_STIMULUS"
 *      timing_first_stim:  how long to show the first stimulus.
 *      timing_second_stim: how long to show the second stimulus. can be -1 to show until a response is given.
 *      timing_image_gap:   how long to show a blank screen between the two stimuli.
 *      timing_post_trial:  how long to show a blank screen after the trial is over.
 *      is_html:            must set to true when using HTML strings as the stimuli.
 *      prompt:             optional HTML string to display with the stimulus.
 *      data:               the optional data object
 * 
 */

(function($) {
    jsPsych.similarity = (function() {

        var plugin = {};

        plugin.create = function(params) {
            var trials = new Array(params.stimuli.length);
            for (var i = 0; i < trials.length; i++) {
                trials[i] = {};
                trials[i].type = "similarity";
                trials[i].a_path = params.stimuli[i][0];
                trials[i].b_path = params.stimuli[i][1];

                // TODO make all changes related to following 4 parameters.
                trials[i].labels = (typeof params.labels === 'undefined') ? ["Not at all similar", "Identical"] : params.labels;
                trials[i].intervals = params.intervals || 100;
                trials[i].show_ticks = (typeof params.show_ticks === 'undefined') ? false : params.show_ticks;

                trials[i].show_response = params.show_response || "SECOND_STIMULUS";

                trials[i].timing_first_stim = params.timing_first_stim || 1000; // default 1000ms
                trials[i].timing_second_stim = params.timing_second_stim || -1; // -1 = inf time; positive numbers = msec to display second image.
                trials[i].timing_image_gap = params.timing_image_gap || 1000; // default 1000ms
                trials[i].timing_post_trial = (typeof params.timing_post_trial === 'undefined') ? 1000 : params.timing_post_trial; // default 1000ms

                trials[i].is_html = (typeof params.is_html === 'undefined') ? false : params.is_html;
                trials[i].prompt = (typeof params.prompt === 'undefined') ? '' : params.prompt;
                trials[i].data = (typeof params.data === 'undefined') ? {} : params.data[i];
            }
            return trials;
        };

        var sim_trial_complete = false;

        plugin.trial = function(display_element, block, trial, part) {
            switch (part) {
            case 1:
                sim_trial_complete = false;
                // show the images
                if (!trial.is_html) {
                    display_element.append($('<img>', {
                        "src": trial.a_path,
                        "id": 'jspsych_sim_stim'
                    }));
                }
                else {
                    display_element.append($('<div>', {
                        "html": trial.a_path,
                        "id": 'jspsych_sim_stim'
                    }));
                }

                if (trial.show_response == "FIRST_STIMULUS") {
                    show_response_slider(display_element, trial, block);
                }

                setTimeout(function() {
                    plugin.trial(display_element, block, trial, part + 1);
                }, trial.timing_first_stim);
                break;

            case 2:

                $('#jspsych_sim_stim').css('visibility', 'hidden');

                setTimeout(function() {
                    plugin.trial(display_element, block, trial, part + 1);
                }, trial.timing_image_gap);
                break;

            case 3:

                if (!trial.is_html) {
                    $('#jspsych_sim_stim').attr('src', trial.b_path);
                }
                else {
                    $('#jspsych_sim_stim').html(trial.b_path);
                }

                $('#jspsych_sim_stim').css('visibility', 'visible');

                if (trial.show_response == "SECOND_STIMULUS") {
                    show_response_slider(display_element, trial, block);
                }

                if (trial.timing_second_stim > 0) {
                    setTimeout(function() {
                        if (!sim_trial_complete) {
                            $("#jspsych_sim_stim").css('visibility', 'hidden');
                            if (trial.show_response == "POST_STIMULUS") {
                                show_response_slider(display_element, trial, block);
                            }
                        }
                    }, trial.timing_second_stim);
                }

                break;
            }
        };

        function show_response_slider(display_element, trial, block) {

            var startTime = (new Date()).getTime();

            // create slider
            display_element.append($('<div>', {
                "id": 'slider',
                "class": 'sim'
            }));

            $("#slider").slider({
                value: Math.ceil(trial.intervals / 2),
                min: 1,
                max: trial.intervals,
                step: 1,
            });

            // show tick marks
            if (trial.show_ticks) {
                for (var j = 1; j < trial.intervals - 1; j++) {
                    $('#slider').append('<div class="slidertickmark"></div>');
                }

                $('#slider .slidertickmark').each(function(index) {
                    var left = (index + 1) * (100 / (trial.intervals - 1));
                    $(this).css({
                        'position': 'absolute',
                        'left': left + '%',
                        'width': '1px',
                        'height': '100%',
                        'background-color': '#222222'
                    });
                });
            }

            // create labels for slider
            display_element.append($('<ul>', {
                "id": "sliderlabels",
                "class": 'sliderlabels',
                "css": {
                    "width": "100%",
                    "height": "3em",
                    "margin": "10px 0px 0px 0px",
                    "padding": "0px",
                    "display": "block",
                    "position": "relative"
                }
            }));

            for (var j = 0; j < trial.labels.length; j++) {
                $("#sliderlabels").append('<li>' + trial.labels[j] + '</li>');
            }

            // position labels to match slider intervals
            var slider_width = $("#slider").width();
            var num_items = trial.labels.length;
            var item_width = slider_width / num_items;
            var spacing_interval = slider_width / (num_items - 1);

            $("#sliderlabels li").each(function(index) {
                $(this).css({
                    'display': 'inline-block',
                    'width': item_width + 'px',
                    'margin': '0px',
                    'padding': '0px',
                    'text-align': 'center',
                    'position': 'absolute',
                    'left': (spacing_interval * index) - (item_width / 2)
                });
            });

            //  create button
            display_element.append($('<button>', {
                'id': 'next',
                'class': 'sim',
                'html': 'Submit Answer'
            }));

            // if prompt is set, show prompt
            if (trial.prompt !== "") {
                display_element.append(trial.prompt);
            }

            $("#next").click(function() {
                var endTime = (new Date()).getTime();
                var response_time = endTime - startTime;
                sim_trial_complete = true;
                var score = $("#slider").slider("value");
                block.writeData($.extend({}, {
                    "sim_score": score,
                    "rt": response_time,
                    "stimulus": trial.a_path,
                    "stimulus_2": trial.b_path,
                    "trial_type": "similarity",
                    "trial_index": block.trial_idx
                }, trial.data));
                // goto next trial in block
                display_element.html('');
                if (trial.timing_post_trial > 0) {
                    setTimeout(function() {
                        block.next();
                    }, trial.timing_post_trial);
                }
                else {
                    block.next();
                }
            });
        }

        return plugin;
    })();
})(jQuery);